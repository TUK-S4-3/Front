import { useEffect, useRef, useState } from "react";
import { AlertCircle, Minus, Plus, RotateCcw } from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

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
  colors: Uint8Array | null;
  count: number;
  sourceCount: number;
};

type PointCloudCamera = {
  position: { set: (x: number, y: number, z: number) => void };
  up: { set: (x: number, y: number, z: number) => void };
  aspect: number;
  updateProjectionMatrix: () => void;
};

type PointCloudControls = InstanceType<typeof OrbitControls>;

type PointCloudMaterial = {
  uniforms: {
    pointSize: { value: number };
  };
  needsUpdate: boolean;
  dispose: () => void;
};

type PointCloudGeometry = {
  dispose: () => void;
};

type PointCloudRenderer = {
  domElement: HTMLCanvasElement;
  setPixelRatio: (pixelRatio: number) => void;
  setClearColor: (color: number, alpha?: number) => void;
  setSize: (width: number, height: number, updateStyle?: boolean) => void;
  render: (scene: unknown, camera: unknown) => void;
  dispose: () => void;
};

const MAX_RENDER_POINTS = 220000;
const DEFAULT_POINT_SIZE = 2;
const MIN_POINT_SIZE = 1;
const MAX_POINT_SIZE = 5;
const POINT_CLOUD_ROTATION_X = Math.PI;

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
  const redIndex = header.properties.findIndex((property) => property.name === "red" || property.name === "r");
  const greenIndex = header.properties.findIndex((property) => property.name === "green" || property.name === "g");
  const blueIndex = header.properties.findIndex((property) => property.name === "blue" || property.name === "b");
  const hasColor = redIndex >= 0 && greenIndex >= 0 && blueIndex >= 0;
  if (xIndex < 0 || yIndex < 0 || zIndex < 0) {
    throw new Error("PLY vertex 좌표(x,y,z) 속성이 없습니다.");
  }

  const step = Math.max(1, Math.ceil(header.vertexCount / MAX_RENDER_POINTS));
  const capacity = Math.ceil(header.vertexCount / step);
  const raw = new Float32Array(capacity * 3);
  const colors = hasColor ? new Uint8Array(capacity * 3) : null;
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
    const red = hasColor ? clamp(Number(tokens[redIndex]), 0, 255) : 0;
    const green = hasColor ? clamp(Number(tokens[greenIndex]), 0, 255) : 0;
    const blue = hasColor ? clamp(Number(tokens[blueIndex]), 0, 255) : 0;
    const shouldKeep = vertexIndex % step === 0;
    vertexIndex += 1;

    if (!shouldKeep || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      continue;
    }

    const base = writeIndex * 3;
    raw[base] = x;
    raw[base + 1] = y;
    raw[base + 2] = z;
    if (colors) {
      colors[base] = red;
      colors[base + 1] = green;
      colors[base + 2] = blue;
    }
    writeIndex += 1;
  }

  if (writeIndex === 0) {
    throw new Error("렌더링 가능한 vertex가 없습니다.");
  }

  return {
    points: normalizePoints(raw, writeIndex),
    colors: colors ? colors.subarray(0, writeIndex * 3) : null,
    count: writeIndex,
    sourceCount: header.vertexCount
  };
}

function parseBinaryCloud(buffer: ArrayBuffer, header: ParsedHeader) {
  const xIndex = header.properties.findIndex((property) => property.name === "x");
  const yIndex = header.properties.findIndex((property) => property.name === "y");
  const zIndex = header.properties.findIndex((property) => property.name === "z");
  const redIndex = header.properties.findIndex((property) => property.name === "red" || property.name === "r");
  const greenIndex = header.properties.findIndex((property) => property.name === "green" || property.name === "g");
  const blueIndex = header.properties.findIndex((property) => property.name === "blue" || property.name === "b");
  const hasColor = redIndex >= 0 && greenIndex >= 0 && blueIndex >= 0;
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
  const colors = hasColor ? new Uint8Array(capacity * 3) : null;
  const view = new DataView(buffer, header.dataOffset);
  let offset = 0;
  let writeIndex = 0;

  for (let vertexIndex = 0; vertexIndex < header.vertexCount; vertexIndex += 1) {
    let x = 0;
    let y = 0;
    let z = 0;
    let red = 0;
    let green = 0;
    let blue = 0;

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
      if (propertyIndex === redIndex) red = clamp(value, 0, 255);
      if (propertyIndex === greenIndex) green = clamp(value, 0, 255);
      if (propertyIndex === blueIndex) blue = clamp(value, 0, 255);
    }

    if (vertexIndex % step !== 0) {
      continue;
    }

    const base = writeIndex * 3;
    raw[base] = x;
    raw[base + 1] = y;
    raw[base + 2] = z;
    if (colors) {
      colors[base] = red;
      colors[base + 1] = green;
      colors[base + 2] = blue;
    }
    writeIndex += 1;
  }

  if (writeIndex === 0) {
    throw new Error("렌더링 가능한 vertex가 없습니다.");
  }

  return {
    points: normalizePoints(raw, writeIndex),
    colors: colors ? colors.subarray(0, writeIndex * 3) : null,
    count: writeIndex,
    sourceCount: header.vertexCount
  };
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

function fitCamera(camera: PointCloudCamera, controls: PointCloudControls) {
  camera.position.set(0, 0.55, 2.6);
  camera.up.set(0, 1, 0);
  controls.target.set(0, 0, 0);
  controls.update();
}

function createPointCloud(cloud: ParsedCloud, pointSize: number) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(cloud.points, 3));
  geometry.computeBoundingSphere();

  if (cloud.colors) {
    geometry.setAttribute("color", new THREE.BufferAttribute(cloud.colors, 3, true));
  } else {
    const fallbackColors = new Uint8Array(cloud.count * 3);
    for (let i = 0; i < cloud.count; i += 1) {
      const base = i * 3;
      fallbackColors[base] = 242;
      fallbackColors[base + 1] = 240;
      fallbackColors[base + 2] = 235;
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(fallbackColors, 3, true));
  }

  const material = new THREE.ShaderMaterial({
    uniforms: {
      pointSize: { value: pointSize },
      opacity: { value: cloud.colors ? 0.96 : 0.88 },
    },
    vertexShader: `
      attribute vec3 color;
      varying vec3 vColor;
      uniform float pointSize;

      void main() {
        vColor = color;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = pointSize;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      uniform float opacity;

      void main() {
        vec2 centered = gl_PointCoord - vec2(0.5);
        float radius = length(centered);
        if (radius > 0.5) {
          discard;
        }
        float edge = smoothstep(0.5, 0.34, radius);
        gl_FragColor = vec4(vColor, opacity * edge);
      }
    `,
    transparent: true,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  points.rotation.x = POINT_CLOUD_ROTATION_X;

  return {
    points,
    geometry: geometry as PointCloudGeometry,
    material: material as PointCloudMaterial,
  };
}

export default function PlyCanvasViewer({ url }: PlyCanvasViewerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const cameraRef = useRef<PointCloudCamera | null>(null);
  const controlsRef = useRef<PointCloudControls | null>(null);
  const materialRef = useRef<PointCloudMaterial | null>(null);
  const pointSizeRef = useRef(DEFAULT_POINT_SIZE);
  const [cloud, setCloud] = useState<ParsedCloud | null>(null);
  const [pointSize, setPointSize] = useState(DEFAULT_POINT_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setCloud(null);
    setLoading(true);
    setError("");
    setPointSize(DEFAULT_POINT_SIZE);

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
    pointSizeRef.current = pointSize;
    const material = materialRef.current;
    if (!material) return;
    material.uniforms.pointSize.value = pointSize;
    material.needsUpdate = true;
  }, [pointSize]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !cloud) return undefined;

    root.replaceChildren();

    let renderer: PointCloudRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }) as PointCloudRenderer;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "WebGL 뷰어 초기화에 실패했습니다.";
      setError(message);
      return undefined;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090b0e);

    const camera = new THREE.PerspectiveCamera(54, 1, 0.01, 100) as PointCloudCamera;
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.35;
    controls.maxDistance = 8;
    controls.panSpeed = 0.75;
    controls.rotateSpeed = 0.85;
    fitCamera(camera, controls);
    cameraRef.current = camera;
    controlsRef.current = controls;

    const { points, geometry, material } = createPointCloud(cloud, pointSizeRef.current);
    materialRef.current = material;
    scene.add(points);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x090b0e, 1);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    root.appendChild(renderer.domElement);

    const resize = () => {
      const rect = root.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width || root.clientWidth || 1));
      const height = Math.max(1, Math.floor(rect.height || root.clientHeight || 1));
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    let frameId = 0;
    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    resize();
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === root) {
        root.removeChild(renderer.domElement);
      }
      cameraRef.current = null;
      controlsRef.current = null;
      materialRef.current = null;
    };
  }, [cloud]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "r") {
        handleResetView();
      }
      if (key === "p") {
        setPointSize((current) => {
          if (current < 1.75) return 2.5;
          if (current < 3.5) return 4;
          return DEFAULT_POINT_SIZE;
        });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const handleResetView = () => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    fitCamera(camera, controls);
  };

  const handleDecreasePointSize = () => {
    setPointSize((current) => clamp(Number((current - 0.5).toFixed(1)), MIN_POINT_SIZE, MAX_POINT_SIZE));
  };

  const handleIncreasePointSize = () => {
    setPointSize((current) => clamp(Number((current + 0.5).toFixed(1)), MIN_POINT_SIZE, MAX_POINT_SIZE));
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#090B0E]">
      <div ref={rootRef} className="h-full w-full" />

      <div className="pointer-events-none absolute left-4 top-20 md:top-24">
        <div className="border border-white/15 bg-black/45 px-4 py-3 text-white/80 backdrop-blur-sm">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
            SfM Point Cloud
          </div>
          <div className="mt-1 text-[12px] font-bold tracking-wide text-white">
            {cloud ? `${cloud.count.toLocaleString("ko-KR")} points` : "Loading"}
          </div>
          {cloud && cloud.sourceCount !== cloud.count && (
            <div className="mt-1 text-[10px] font-medium text-white/45">
              sampled from {cloud.sourceCount.toLocaleString("ko-KR")}
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-auto absolute right-4 top-20 md:top-24 flex items-center gap-2">
        <button
          type="button"
          onClick={handleDecreasePointSize}
          className="inline-flex h-9 w-9 items-center justify-center border border-white/20 bg-black/45 text-white/80 backdrop-blur-sm hover:border-[#D95F39] hover:text-[#D95F39]"
          aria-label="Decrease point size"
        >
          <Minus size={14} />
        </button>
        <div className="h-9 border border-white/15 bg-black/45 px-3 text-[10px] font-black uppercase tracking-[0.14em] leading-9 text-white/70 backdrop-blur-sm">
          Point {pointSize.toFixed(1)}px
        </div>
        <button
          type="button"
          onClick={handleIncreasePointSize}
          className="inline-flex h-9 w-9 items-center justify-center border border-white/20 bg-black/45 text-white/80 backdrop-blur-sm hover:border-[#D95F39] hover:text-[#D95F39]"
          aria-label="Increase point size"
        >
          <Plus size={14} />
        </button>
        <button
          type="button"
          onClick={handleResetView}
          className="inline-flex h-9 items-center gap-2 border border-white/20 bg-black/45 px-3 text-[10px] font-black uppercase tracking-[0.14em] text-white/80 backdrop-blur-sm hover:border-[#D95F39] hover:text-[#D95F39]"
        >
          <RotateCcw size={13} />
          Reset
        </button>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#090B0E]/90 text-[11px] font-black uppercase tracking-[0.3em] text-white/55">
          Point Cloud Loading...
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#090B0E]/95 p-6">
          <div className="flex max-w-md items-start gap-3 border border-[#D95F39]/50 bg-black/50 px-5 py-4 text-[11px] font-bold tracking-wide text-[#FF8C6E]">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
