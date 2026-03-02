import { useEffect, useRef, useState } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

type PlyCanvasViewerProps = {
  url: string;
};

type PlyFormat = "ascii" | "binary_little_endian";

type ParsedHeader = {
  format: PlyFormat;
  vertexCount: number;
  properties: Array<{ type: string; name: string }>;
  dataOffset: number;
};

type ParsedCloud = {
  points: Float32Array;
  count: number;
};

type CameraState = {
  yaw: number;
  pitch: number;
  zoom: number;
  panX: number;
  panY: number;
};

const MAX_RENDER_POINTS = 50000;

const END_HEADER_CRLF = new TextEncoder().encode("end_header\r\n");
const END_HEADER_LF = new TextEncoder().encode("end_header\n");

const TYPE_READERS: Record<string, { size: number; read: (view: DataView, offset: number) => number }> = {
  char: { size: 1, read: (view, offset) => view.getInt8(offset) },
  int8: { size: 1, read: (view, offset) => view.getInt8(offset) },
  uchar: { size: 1, read: (view, offset) => view.getUint8(offset) },
  uint8: { size: 1, read: (view, offset) => view.getUint8(offset) },
  short: { size: 2, read: (view, offset) => view.getInt16(offset, true) },
  int16: { size: 2, read: (view, offset) => view.getInt16(offset, true) },
  ushort: { size: 2, read: (view, offset) => view.getUint16(offset, true) },
  uint16: { size: 2, read: (view, offset) => view.getUint16(offset, true) },
  int: { size: 4, read: (view, offset) => view.getInt32(offset, true) },
  int32: { size: 4, read: (view, offset) => view.getInt32(offset, true) },
  uint: { size: 4, read: (view, offset) => view.getUint32(offset, true) },
  uint32: { size: 4, read: (view, offset) => view.getUint32(offset, true) },
  float: { size: 4, read: (view, offset) => view.getFloat32(offset, true) },
  float32: { size: 4, read: (view, offset) => view.getFloat32(offset, true) },
  double: { size: 8, read: (view, offset) => view.getFloat64(offset, true) },
  float64: { size: 8, read: (view, offset) => view.getFloat64(offset, true) },
};

function findSequence(data: Uint8Array, marker: Uint8Array) {
  if (marker.length === 0 || data.length < marker.length) return -1;
  outer: for (let i = 0; i <= data.length - marker.length; i += 1) {
    for (let j = 0; j < marker.length; j += 1) {
      if (data[i + j] !== marker[j]) {
        continue outer;
      }
    }
    return i;
  }
  return -1;
}

function parseHeader(bytes: Uint8Array): ParsedHeader {
  const crlfIndex = findSequence(bytes, END_HEADER_CRLF);
  const lfIndex = findSequence(bytes, END_HEADER_LF);
  const marker = crlfIndex >= 0 ? END_HEADER_CRLF : END_HEADER_LF;
  const markerIndex = crlfIndex >= 0 ? crlfIndex : lfIndex;

  if (markerIndex < 0) {
    throw new Error("PLY header를 찾을 수 없습니다.");
  }

  const dataOffset = markerIndex + marker.length;
  const headerText = new TextDecoder().decode(bytes.subarray(0, dataOffset));
  const lines = headerText.split(/\r?\n/);

  let format: PlyFormat | null = null;
  let vertexCount = 0;
  let inVertexElement = false;
  const properties: Array<{ type: string; name: string }> = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("comment")) {
      continue;
    }

    const tokens = line.split(/\s+/);
    if (tokens[0] === "format") {
      if (tokens[1] === "ascii" || tokens[1] === "binary_little_endian") {
        format = tokens[1];
        continue;
      }
      throw new Error(`지원하지 않는 PLY 포맷입니다: ${tokens[1]}`);
    }

    if (tokens[0] === "element") {
      inVertexElement = tokens[1] === "vertex";
      if (inVertexElement) {
        vertexCount = Number(tokens[2] ?? 0);
      }
      continue;
    }

    if (tokens[0] === "property" && inVertexElement) {
      if (tokens[1] === "list") {
        continue;
      }
      const propType = tokens[1];
      const propName = tokens[2];
      if (propType && propName) {
        properties.push({ type: propType, name: propName });
      }
    }
  }

  if (!format) {
    throw new Error("PLY 포맷 정보가 없습니다.");
  }
  if (!vertexCount || vertexCount < 1) {
    throw new Error("vertex 정보가 없습니다.");
  }

  return { format, vertexCount, properties, dataOffset };
}

function normalizePoints(rawPoints: Float32Array, count: number) {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < count; i += 1) {
    const base = i * 3;
    const x = rawPoints[base];
    const y = rawPoints[base + 1];
    const z = rawPoints[base + 2];
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;
  const extent = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
  const scale = 1.8 / extent;

  const normalized = rawPoints.subarray(0, count * 3);
  for (let i = 0; i < count; i += 1) {
    const base = i * 3;
    normalized[base] = (normalized[base] - centerX) * scale;
    normalized[base + 1] = (normalized[base + 1] - centerY) * scale;
    normalized[base + 2] = (normalized[base + 2] - centerZ) * scale;
  }

  return normalized;
}

function parseAsciiCloud(buffer: ArrayBuffer, header: ParsedHeader) {
  const body = new TextDecoder().decode(new Uint8Array(buffer, header.dataOffset));
  const lines = body.split(/\r?\n/);
  const xIndex = header.properties.findIndex((property) => property.name === "x");
  const yIndex = header.properties.findIndex((property) => property.name === "y");
  const zIndex = header.properties.findIndex((property) => property.name === "z");
  if (xIndex < 0 || yIndex < 0 || zIndex < 0) {
    throw new Error("PLY vertex 좌표(x,y,z) 속성이 없습니다.");
  }

  const step = Math.max(1, Math.ceil(header.vertexCount / MAX_RENDER_POINTS));
  const capacity = Math.ceil(header.vertexCount / step);
  const raw = new Float32Array(capacity * 3);
  let vertexIndex = 0;
  let writeIndex = 0;

  for (const rawLine of lines) {
    if (vertexIndex >= header.vertexCount) break;
    const line = rawLine.trim();
    if (!line) continue;

    const tokens = line.split(/\s+/);
    const x = Number(tokens[xIndex]);
    const y = Number(tokens[yIndex]);
    const z = Number(tokens[zIndex]);
    const shouldKeep = vertexIndex % step === 0;
    vertexIndex += 1;

    if (!shouldKeep || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      continue;
    }

    const base = writeIndex * 3;
    raw[base] = x;
    raw[base + 1] = y;
    raw[base + 2] = z;
    writeIndex += 1;
  }

  if (writeIndex === 0) {
    throw new Error("렌더링 가능한 vertex가 없습니다.");
  }

  return { points: normalizePoints(raw, writeIndex), count: writeIndex };
}

function parseBinaryCloud(buffer: ArrayBuffer, header: ParsedHeader) {
  const xIndex = header.properties.findIndex((property) => property.name === "x");
  const yIndex = header.properties.findIndex((property) => property.name === "y");
  const zIndex = header.properties.findIndex((property) => property.name === "z");
  if (xIndex < 0 || yIndex < 0 || zIndex < 0) {
    throw new Error("PLY vertex 좌표(x,y,z) 속성이 없습니다.");
  }

  const readers = header.properties.map((property) => {
    const reader = TYPE_READERS[property.type];
    if (!reader) {
      throw new Error(`지원하지 않는 property 타입입니다: ${property.type}`);
    }
    return reader;
  });

  const step = Math.max(1, Math.ceil(header.vertexCount / MAX_RENDER_POINTS));
  const capacity = Math.ceil(header.vertexCount / step);
  const raw = new Float32Array(capacity * 3);
  const view = new DataView(buffer, header.dataOffset);
  let offset = 0;
  let writeIndex = 0;

  for (let vertexIndex = 0; vertexIndex < header.vertexCount; vertexIndex += 1) {
    let x = 0;
    let y = 0;
    let z = 0;

    for (let propertyIndex = 0; propertyIndex < readers.length; propertyIndex += 1) {
      const reader = readers[propertyIndex];
      if (offset + reader.size > view.byteLength) {
        throw new Error("PLY binary 데이터 길이가 올바르지 않습니다.");
      }
      const value = reader.read(view, offset);
      offset += reader.size;

      if (propertyIndex === xIndex) x = value;
      if (propertyIndex === yIndex) y = value;
      if (propertyIndex === zIndex) z = value;
    }

    if (vertexIndex % step !== 0) {
      continue;
    }

    const base = writeIndex * 3;
    raw[base] = x;
    raw[base + 1] = y;
    raw[base + 2] = z;
    writeIndex += 1;
  }

  if (writeIndex === 0) {
    throw new Error("렌더링 가능한 vertex가 없습니다.");
  }

  return { points: normalizePoints(raw, writeIndex), count: writeIndex };
}

function parsePly(arrayBuffer: ArrayBuffer): ParsedCloud {
  const bytes = new Uint8Array(arrayBuffer);
  const header = parseHeader(bytes);
  if (header.format === "ascii") {
    return parseAsciiCloud(arrayBuffer, header);
  }
  return parseBinaryCloud(arrayBuffer, header);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function drawCloud(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  cloud: ParsedCloud,
  camera: CameraState
) {
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#F2F0EB";
  context.fillRect(0, 0, width, height);

  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const focal = Math.min(width, height) * 0.85;
  const pointSize = Math.max(1, 2.2 / camera.zoom);
  const cosYaw = Math.cos(camera.yaw);
  const sinYaw = Math.sin(camera.yaw);
  const cosPitch = Math.cos(camera.pitch);
  const sinPitch = Math.sin(camera.pitch);
  const points = cloud.points;

  context.fillStyle = "#1A3C34";
  for (let i = 0; i < cloud.count; i += 1) {
    const base = i * 3;
    const x = points[base];
    const y = points[base + 1];
    const z = points[base + 2];

    const x1 = cosYaw * x + sinYaw * z;
    const z1 = -sinYaw * x + cosYaw * z;
    const y1 = cosPitch * y - sinPitch * z1;
    const z2 = sinPitch * y + cosPitch * z1;

    const depth = z2 + camera.zoom + 2.6;
    if (depth <= 0.05) continue;

    const screenX = halfWidth + ((x1 + camera.panX) * focal) / depth;
    const screenY = halfHeight - ((y1 + camera.panY) * focal) / depth;

    if (screenX < 0 || screenX >= width || screenY < 0 || screenY >= height) {
      continue;
    }

    context.fillRect(screenX, screenY, pointSize, pointSize);
  }
}

function initialCamera(): CameraState {
  return { yaw: 0, pitch: 0.2, zoom: 2.4, panX: 0, panY: 0 };
}

export default function PlyCanvasViewer({ url }: PlyCanvasViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef<CameraState>(initialCamera());
  const drawRef = useRef<() => void>(() => {});
  const [cloud, setCloud] = useState<ParsedCloud | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setCloud(null);
    setLoading(true);
    setError("");
    cameraRef.current = initialCamera();

    (async () => {
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`모델 다운로드 실패: HTTP ${response.status}`);
        }
        const buffer = await response.arrayBuffer();
        const parsed = parsePly(buffer);
        setCloud(parsed);
      } catch (caught) {
        if (controller.signal.aborted) return;
        const message = caught instanceof Error ? caught.message : "PLY 로딩 중 오류가 발생했습니다.";
        setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [url]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cloud) return undefined;

    const context = canvas.getContext("2d");
    if (!context) return undefined;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width));
      canvas.height = Math.max(1, Math.floor(rect.height));
      drawRef.current();
    };

    const draw = () => {
      drawCloud(context, canvas.width, canvas.height, cloud, cameraRef.current);
    };
    drawRef.current = draw;

    const drag = { active: false, x: 0, y: 0, mode: "rotate" as "rotate" | "pan" };

    const onPointerDown = (event: PointerEvent) => {
      drag.active = true;
      drag.x = event.clientX;
      drag.y = event.clientY;
      drag.mode = event.button === 2 || event.shiftKey ? "pan" : "rotate";
      canvas.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!drag.active) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      drag.x = event.clientX;
      drag.y = event.clientY;

      if (drag.mode === "rotate") {
        cameraRef.current.yaw += dx * 0.01;
        cameraRef.current.pitch = clamp(cameraRef.current.pitch + dy * 0.01, -1.35, 1.35);
      } else {
        cameraRef.current.panX += dx * 0.004;
        cameraRef.current.panY -= dy * 0.004;
      }
      draw();
    };

    const onPointerUp = (event: PointerEvent) => {
      drag.active = false;
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      cameraRef.current.zoom = clamp(cameraRef.current.zoom + event.deltaY * 0.002, 1.1, 8);
      draw();
    };

    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    window.addEventListener("resize", resize);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("contextmenu", onContextMenu);
    resize();

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", onContextMenu);
    };
  }, [cloud]);

  const handleResetView = () => {
    cameraRef.current = initialCamera();
    drawRef.current();
  };

  return (
    <div className="relative w-full h-full min-h-[320px] border border-[#1A3C34]/10 bg-[#F2F0EB]">
      <canvas ref={canvasRef} className="w-full h-full block" />

      <div className="absolute left-3 top-3 right-3 flex items-center justify-between gap-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1A3C34]/55 bg-white/90 px-3 py-2 border border-[#1A3C34]/10">
          좌클릭 드래그: 회전 / Shift+드래그: 이동 / 휠: 줌
        </div>
        <button
          type="button"
          onClick={handleResetView}
          className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.18em] px-3 py-2 bg-white/90 border border-[#1A3C34]/15 text-[#1A3C34] hover:border-[#D95F39] hover:text-[#D95F39]"
        >
          <RotateCcw size={12} />
          Reset
        </button>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F2F0EB]/90 text-[11px] font-black uppercase tracking-[0.3em] text-[#1A3C34]/45">
          PLY Loading...
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F2F0EB]/95 p-6">
          <div className="max-w-md bg-white border border-[#D95F39]/30 text-[#D95F39] px-5 py-4 text-[11px] font-bold tracking-wide flex items-start gap-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
