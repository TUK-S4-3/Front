import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";
import * as THREE from "three";

type GaussianSplatViewerProps = {
  url: string;
  showControlsHint?: boolean;
};

export type GaussianSplatViewerHandle = {
  captureJpegBlob: (quality?: number) => Promise<Blob>;
};

type AbortableTask<T = unknown> = {
  then: (onResolve?: (value: T) => unknown) => AbortableTask<unknown>;
  catch: (onFail?: (error: unknown) => unknown) => AbortableTask<unknown>;
  abort?: (reason?: unknown) => void;
};

type ViewerInstance = {
  addSplatScene: (path: string, options?: Record<string, unknown>) => AbortableTask<unknown>;
  start: () => void;
  stop?: () => void;
  dispose: () => Promise<void>;
  forceRenderNextFrame?: () => void;
  camera?: {
    up?: { x: number; y: number; z: number };
    position?: { x: number; y: number; z: number };
    quaternion?: { x: number; y: number; z: number; w: number };
  };
  controls?: {
    target?: { x: number; y: number; z: number };
    update?: () => void;
  };
  perspectiveControls?: {
    target?: { x: number; y: number; z: number };
    update?: () => void;
  };
  orthographicControls?: {
    target?: { x: number; y: number; z: number };
    update?: () => void;
  };
  renderer?: {
    domElement?: HTMLCanvasElement;
    setSize?: (width: number, height: number) => void;
    setPixelRatio?: (pixelRatio: number) => void;
    getContext?: () => WebGLRenderingContext | WebGL2RenderingContext;
  };
};

type ViewerCtor = new (options?: Record<string, unknown>) => ViewerInstance;

type SceneFormatValue = number | string;

type GaussianSplatsModule = {
  Viewer: ViewerCtor;
  SceneFormat: {
    Ply?: SceneFormatValue;
    Splat?: SceneFormatValue;
    KSplat?: SceneFormatValue;
  };
};

type ThreeRenderer = {
  domElement: HTMLCanvasElement;
  autoClear: boolean;
  setPixelRatio: (pixelRatio: number) => void;
  setClearColor: (color: unknown, alpha?: number) => void;
  setSize: (width: number, height: number, updateStyle?: boolean) => void;
  getContext: () => WebGLRenderingContext | WebGL2RenderingContext;
  dispose: () => void;
};

const GS = GaussianSplats3D as unknown as GaussianSplatsModule;
const SCENE_ROTATION_FIX = [1, 0, 0, 0] as [number, number, number, number]; // 180deg around X

function getRenderDimensions(root: HTMLDivElement) {
  const rect = root.getBoundingClientRect();
  return {
    width: Math.max(1, Math.floor(rect.width || root.clientWidth || 1)),
    height: Math.max(1, Math.floor(rect.height || root.clientHeight || 1)),
  };
}

function createExternalRenderer(root: HTMLDivElement) {
  const renderer = new (THREE as any).WebGLRenderer({
    antialias: false,
    precision: "highp",
    alpha: true,
    preserveDrawingBuffer: true,
  }) as ThreeRenderer;
  const { width, height } = getRenderDimensions(root);
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.autoClear = true;
  renderer.setClearColor(new (THREE as any).Color(0x000000), 0.0);
  renderer.setSize(width, height, false);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";
  renderer.domElement.style.touchAction = "none";
  root.appendChild(renderer.domElement);
  return renderer;
}

function createViewerOptions(root: HTMLDivElement, renderer: ThreeRenderer) {
  return {
    rootElement: root,
    renderer,
    useBuiltInControls: true,
    sharedMemoryForWorkers: false,
    gpuAcceleratedSort: false,
    antialiased: true,
    focalAdjustment: 1.08,
    kernel2DSize: 0.2,
    sphericalHarmonicsDegree: 1,
    sceneRevealMode: (GaussianSplats3D as unknown as { SceneRevealMode?: { Gradual?: number | string } }).SceneRevealMode
      ?.Gradual,
    cameraUp: [0, 1, 0] as [number, number, number],
    initialCameraPosition: initialCameraPosition(),
    initialCameraLookAt: initialCameraLookAt(),
    renderMode: (GaussianSplats3D as unknown as { RenderMode?: { Always?: number | string } }).RenderMode?.Always,
    logLevel: (GaussianSplats3D as unknown as { LogLevel?: { None?: number | string } }).LogLevel?.None,
    ignoreDevicePixelRatio: false,
  };
}

function relaxOrbitLimits(viewer: ViewerInstance) {
  const anyViewer = viewer as unknown as {
    controls?: {
      minPolarAngle?: number;
      maxPolarAngle?: number;
      update?: () => void;
    };
    perspectiveControls?: {
      minPolarAngle?: number;
      maxPolarAngle?: number;
      update?: () => void;
    };
    orthographicControls?: {
      minPolarAngle?: number;
      maxPolarAngle?: number;
      update?: () => void;
    };
  };

  const apply = (controls?: {
    minPolarAngle?: number;
    maxPolarAngle?: number;
    update?: () => void;
  }) => {
    if (!controls) return;
    controls.minPolarAngle = 0.001;
    controls.maxPolarAngle = Math.PI - 0.001;
    controls.update?.();
  };

  apply(anyViewer.controls);
  apply(anyViewer.perspectiveControls);
  apply(anyViewer.orthographicControls);
}

function inferSceneFormat(url: string): SceneFormatValue | undefined {
  const lower = url.toLowerCase();
  if (lower.includes(".ksplat")) return GS.SceneFormat.KSplat;
  if (lower.includes(".splat")) return GS.SceneFormat.Splat;
  if (lower.includes(".ply")) return GS.SceneFormat.Ply;
  return GS.SceneFormat.Ply;
}

function isAbortLikeError(error: unknown) {
  const text = String(error instanceof Error ? error.message : error);
  return text.includes("Abort") || text.includes("NS_BINDING_ABORTED") || text.includes("aborted");
}

function mapLoadError(error: unknown) {
  const text = String(error instanceof Error ? error.message : error);
  if (text.includes("Failed to fetch") || text.includes("NetworkError")) {
    return "모델 파일 요청이 차단되었습니다. URL/CORS 설정을 확인해 주세요.";
  }
  if (text.includes("SharedArrayBuffer") || text.includes("crossOriginIsolated")) {
    return "브라우저 보안 정책으로 로드가 차단되었습니다. viewer worker 설정을 확인해 주세요.";
  }
  if (isAbortLikeError(error)) {
    return "모델 다운로드가 중단되었습니다. 잠시 후 다시 시도해 주세요.";
  }
  return text || "Gaussian Splat 로딩 중 오류가 발생했습니다.";
}

function initialCameraPosition() {
  return [0, 0.6, 2.4] as [number, number, number];
}

function initialCameraLookAt() {
  return [0, 0, 0] as [number, number, number];
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("THUMBNAIL_CAPTURE_EMPTY"));
        return;
      }
      resolve(blob);
    }, "image/jpeg", quality);
  });
}

function shouldIgnoreHotkeyTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (element.isContentEditable) return true;
  return false;
}

function applyCameraRoll(viewer: ViewerInstance, deltaRadians: number) {
  const anyViewer = viewer as unknown as {
    camera?: {
      up?: { x: number; y: number; z: number; applyQuaternion?: (q: unknown) => unknown; normalize?: () => unknown };
      position?: {
        x: number;
        y: number;
        z: number;
        sub?: (v: unknown) => unknown;
        add?: (v: unknown) => unknown;
        applyAxisAngle?: (axis: unknown, angle: number) => unknown;
      };
    };
    controls?: { target?: { x: number; y: number; z: number }; update?: () => void };
    perspectiveControls?: { target?: { x: number; y: number; z: number }; update?: () => void };
    orthographicControls?: { target?: { x: number; y: number; z: number }; update?: () => void };
    forceRenderNextFrame?: () => void;
  };

  const camera = anyViewer.camera;
  if (!camera?.position || !camera?.up) return;

  const controls = anyViewer.controls ?? anyViewer.perspectiveControls ?? anyViewer.orthographicControls;
  const target = controls?.target;
  if (!target) return;

  // Minimal vector math without importing three types
  const vx = camera.position.x - target.x;
  const vy = camera.position.y - target.y;
  const vz = camera.position.z - target.z;
  const viewLen = Math.hypot(vx, vy, vz);
  if (viewLen < 1e-6) return;
  const ax = vx / viewLen;
  const ay = vy / viewLen;
  const az = vz / viewLen;

  const ux = camera.up.x;
  const uy = camera.up.y;
  const uz = camera.up.z;

  const c = Math.cos(deltaRadians);
  const s = Math.sin(deltaRadians);
  const dot = ax * ux + ay * uy + az * uz;

  // Rodrigues' rotation formula for rotating up vector around view axis
  const rx = ux * c + (ay * uz - az * uy) * s + ax * dot * (1 - c);
  const ry = uy * c + (az * ux - ax * uz) * s + ay * dot * (1 - c);
  const rz = uz * c + (ax * uy - ay * ux) * s + az * dot * (1 - c);
  const rLen = Math.hypot(rx, ry, rz) || 1;

  camera.up.x = rx / rLen;
  camera.up.y = ry / rLen;
  camera.up.z = rz / rLen;

  controls?.update?.();
  anyViewer.forceRenderNextFrame?.();
}

const GaussianSplatViewer = forwardRef<GaussianSplatViewerHandle, GaussianSplatViewerProps>(function GaussianSplatViewer(
  { url, showControlsHint = true },
  ref
) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<ViewerInstance | null>(null);
  const loadTaskRef = useRef<AbortableTask<unknown> | null>(null);
  const rendererRef = useRef<ThreeRenderer | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useImperativeHandle(ref, () => ({
    async captureJpegBlob(quality = 0.92) {
      const viewer = viewerRef.current;
      const renderer = rendererRef.current;
      const canvas = renderer?.domElement;
      if (!viewer || !renderer || !canvas) {
        throw new Error("THUMBNAIL_CANVAS_NOT_FOUND");
      }

      viewer.forceRenderNextFrame?.();
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

      const context = renderer.getContext();
      context.finish?.();

      if (canvas.width < 1 || canvas.height < 1) {
        throw new Error("THUMBNAIL_CANVAS_NOT_READY");
      }

      return canvasToBlob(canvas, quality);
    },
  }));

  useEffect(() => {
    let disposed = false;
    setLoading(true);
    setError("");

    if (!url || !String(url).trim()) {
      setError("결과 파일 URL이 올바르지 않습니다.");
      setLoading(false);
      return () => {
        disposed = true;
      };
    }

    const root = rootRef.current;
    if (!root) {
      setError("뷰어 초기화에 실패했습니다. root element가 없습니다.");
      setLoading(false);
      return () => {
        disposed = true;
      };
    }

    root.replaceChildren();
    const renderer = createExternalRenderer(root);
    rendererRef.current = renderer;

    const resizeObserver = new ResizeObserver(() => {
      const nextRenderer = rendererRef.current;
      const nextViewer = viewerRef.current;
      const currentRoot = rootRef.current;
      if (!nextRenderer || !currentRoot) return;
      const { width, height } = getRenderDimensions(currentRoot);
      nextRenderer.setPixelRatio(window.devicePixelRatio || 1);
      nextRenderer.setSize(width, height, false);
      nextViewer?.forceRenderNextFrame?.();
    });
    resizeObserver.observe(root);
    resizeObserverRef.current = resizeObserver;

    let viewer: ViewerInstance;
    try {
      viewer = new GS.Viewer(createViewerOptions(root, renderer));
    } catch (caught) {
      if (!disposed) {
        console.error("[GaussianSplatViewer] viewer init error", caught);
        setError(mapLoadError(caught));
        setLoading(false);
      }
      resizeObserver.disconnect();
      resizeObserverRef.current = null;
      renderer.dispose();
      rendererRef.current = null;
      return () => {
        disposed = true;
      };
    }

    viewerRef.current = viewer;

    const loadTask = viewer.addSplatScene(String(url).trim(), {
      format: inferSceneFormat(String(url).trim()),
      progressiveLoad: true,
      showLoadingUI: false,
      splatAlphaRemovalThreshold: 5,
      rotation: SCENE_ROTATION_FIX,
    });
    loadTaskRef.current = loadTask;

    loadTask
      .then(() => {
        if (disposed || loadTaskRef.current !== loadTask) return;
        relaxOrbitLimits(viewer);
        viewer.start();
        setLoading(false);
      })
      .catch((caught) => {
        if (disposed || loadTaskRef.current !== loadTask) return;
        if (!isAbortLikeError(caught)) {
          console.error("[GaussianSplatViewer] load error", caught);
          setError(mapLoadError(caught));
        }
        setLoading(false);
      });

    return () => {
      disposed = true;
      if (loadTaskRef.current === loadTask) {
        loadTaskRef.current = null;
      }
      const resizeObserver = resizeObserverRef.current;
      resizeObserverRef.current = null;
      resizeObserver?.disconnect();
      try {
        loadTask.abort?.("Scene disposed");
      } catch {
        // noop
      }

      const current = viewerRef.current ?? viewer;
      viewerRef.current = null;
      try {
        current.stop?.();
      } catch {
        // noop
      }
      void current
        .dispose()
        .catch(() => {
          // noop
        })
        .finally(() => {
          if (rendererRef.current === renderer) {
            rendererRef.current = null;
          }
          try {
            renderer.dispose();
          } catch {
            // noop
          }
          const activeRoot = rootRef.current;
          if (activeRoot && renderer.domElement.parentElement === activeRoot) {
            activeRoot.removeChild(renderer.domElement);
          }
        });
    };
  }, [url]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreHotkeyTarget(event.target)) return;

      const key = event.key.toLowerCase();
      if (key !== "q" && key !== "e") return;

      const viewer = viewerRef.current;
      if (!viewer) return;

      event.preventDefault();
      const baseStep = event.shiftKey ? (Math.PI / 24) : (Math.PI / 72);
      const delta = key === "q" ? -baseStep : baseStep;
      applyCameraRoll(viewer, delta);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-[#090B0E]"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: "#090B0E",
      }}
    >
      <div
        ref={rootRef}
        className="w-full h-full"
        style={{ width: "100%", height: "100%" }}
      />

      <div className="pointer-events-none absolute left-4 top-20 md:top-24 flex items-start gap-2">
        {showControlsHint && (
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/80 bg-black/45 px-3 py-2 border border-white/20 backdrop-blur-sm">
            좌클릭 드래그: 회전 / 우클릭+드래그: 이동 / 휠: 줌 / Q,E: 화면 기울기
          </div>
        )}
      </div>

      {loading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-[#090B0E]/90 text-[11px] font-black uppercase tracking-[0.3em] text-white/50"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(9, 11, 14, 0.9)",
            color: "rgba(255,255,255,0.7)",
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
          }}
        >
          Gaussian Splat Loading...
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#090B0E]/95 p-6">
          <div className="max-w-md bg-black/50 border border-[#D95F39]/50 text-[#FF8C6E] px-5 py-4 text-[11px] font-bold tracking-wide flex items-start gap-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-3 px-4">
        <p className="text-center text-[10px] tracking-wide text-white/45 bg-black/30 border border-white/10 rounded px-3 py-2 backdrop-blur-sm">
          Powered by @mkkellogg/gaussian-splats-3d and three.js (MIT License)
        </p>
      </div>
    </div>
  );
});

export default GaussianSplatViewer;
