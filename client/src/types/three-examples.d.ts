declare module "three/examples/jsm/controls/OrbitControls.js" {
  type OrbitControlVector = {
    set: (x: number, y: number, z: number) => void;
  };

  type OrbitControlsInstance = {
    enableDamping: boolean;
    dampingFactor: number;
    minDistance: number;
    maxDistance: number;
    panSpeed: number;
    rotateSpeed: number;
    target: OrbitControlVector;
    update: () => void;
    dispose: () => void;
  };

  export const OrbitControls: new (camera: unknown, domElement: HTMLElement) => OrbitControlsInstance;
}
