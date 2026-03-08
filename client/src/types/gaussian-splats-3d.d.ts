declare module "@mkkellogg/gaussian-splats-3d" {
  export const SceneFormat: {
    Ply: number | string;
    Splat: number | string;
    KSplat: number | string;
  };

  export const SceneRevealMode: {
    Default: number | string;
    Gradual: number | string;
    Instant: number | string;
  };

  export const RenderMode: {
    Always: number | string;
    OnChange: number | string;
    Never: number | string;
  };

  export const LogLevel: {
    None: number | string;
    Info: number | string;
    Warn: number | string;
    Error: number | string;
  };

  export class Viewer {
    constructor(options?: Record<string, unknown>);
    addSplatScene(path: string, options?: Record<string, unknown>): Promise<unknown>;
    start(): void;
    stop(): void;
    dispose(): Promise<void>;
  }
}
