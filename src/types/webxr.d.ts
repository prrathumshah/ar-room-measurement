/// <reference lib="dom" />

declare global {
  interface Navigator {
    xr?: XRSystem;
  }

  interface XRSystem {
    isSessionSupported(mode: XRSessionMode): Promise<boolean>;
    requestSession(mode: XRSessionMode, options?: XRSessionInit): Promise<XRSession>;
  }

  interface XRSession {
    end(): void;
    requestReferenceSpace(type: XRReferenceSpaceType): Promise<XRRigidTransform>;
    requestHitTestSource(options: { space: XRSpace }): Promise<XRHitTestSource>;
    addEventListener(type: 'end', listener: () => void): void;
  }

  interface XRHitTestSource {}
  interface XRSpace {}
  interface XRRigidTransform {
    matrix: Float32Array | number[];
  }

  interface XRFrame {
    getHitTestResults(hitTestSource: XRHitTestSource): XRHitTestResult[];
  }

  interface XRHitTestResult {
    getPose(referenceSpace: XRSpace): XRPose | null;
  }

  interface XRPose {
    transform: {
      matrix: Float32Array | number[];
    };
  }

  type XRReferenceSpaceType = 'viewer' | 'local' | 'local-floor' | 'bounded-floor';
  type XRSessionMode = 'immersive-ar' | 'inline';

  interface XRSessionInit {
    requiredFeatures?: string[];
    optionalFeatures?: string[];
    domOverlay?: { root: Element | DocumentFragment };
  }
}

export {};
