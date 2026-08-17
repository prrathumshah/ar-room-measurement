import { AlertTriangle, Camera, Check, MapPin, Undo2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { calculateAreaMetrics, type RoomType } from '../hooks/useAreaMath';

export interface CornerPoint {
  x: number;
  y: number;
  z: number;
}

interface ARMeasurementViewProps {
  roomName: string;
  roomType: RoomType;
  onSave: (payload: Record<string, unknown>) => void;
  onMetricsChange: (points: CornerPoint[]) => void;
}

export function ARMeasurementView({ roomName, roomType, onSave, onMetricsChange }: ARMeasurementViewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const reticleRef = useRef<THREE.Object3D | null>(null);
  const hitTestSourceRef = useRef<any>(null);
  const sessionRef = useRef<any>(null);
  const floorPlaneRef = useRef<THREE.Mesh | null>(null);
  const polygonGroupRef = useRef<THREE.Group | null>(null);

  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isARSupported, setIsARSupported] = useState<boolean | null>(null);
  const [status, setStatus] = useState('Tap "Start AR Session" to begin');
  const [corners, setCorners] = useState<CornerPoint[]>([]);
  const [currentReticle, setCurrentReticle] = useState<CornerPoint | null>(null);

  const areaMetrics = useMemo(() => calculateAreaMetrics(corners, roomType), [corners, roomType]);

  // Check device AR capability on mount without starting a session
  useEffect(() => {
    const checkARSupport = async () => {
      const xr = (navigator as Navigator & { xr?: any }).xr;
      if (!xr || typeof xr.isSessionSupported !== 'function') {
        setIsARSupported(false);
        setStatus('WebXR not supported in this browser');
        return;
      }

      try {
        const supported = await xr.isSessionSupported('immersive-ar');
        setIsARSupported(supported);
        if (!supported) {
          setStatus('Device does not support immersive AR');
        }
      } catch (err) {
        console.error('[AR] isSessionSupported check failed:', err);
        setIsARSupported(false);
      }
    };

    checkARSupport();
  }, []);

  // Initialize Three.js scene and viewport renderer
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(70, 1, 0.01, 1000);
    camera.position.set(0, 1.6, 3);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.xr.enabled = true;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    const ambient = new THREE.HemisphereLight(0xffffff, 0x060d17, 1.4);
    scene.add(ambient);

    const reticleMaterial = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.95,
    });
    const reticle = new THREE.Mesh(new THREE.RingGeometry(0.04, 0.06, 48), reticleMaterial);
    reticle.rotation.x = -Math.PI / 2;
    reticle.visible = false;
    reticleRef.current = reticle;
    scene.add(reticle);

    const floorPlane = new THREE.Mesh(
      new THREE.CircleGeometry(0.4, 48),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
      })
    );
    floorPlane.rotation.x = -Math.PI / 2;
    floorPlane.visible = false;
    floorPlaneRef.current = floorPlane;
    scene.add(floorPlane);

    const polygonGroup = new THREE.Group();
    polygonGroupRef.current = polygonGroup;
    scene.add(polygonGroup);

    const resize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      const { clientWidth, clientHeight } = mountRef.current;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight, false);
    };

    resize();
    window.addEventListener('resize', resize);

    // Fallback animation loop when outside active XR session
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (reticleRef.current) {
        reticleRef.current.rotation.z += 0.02;
      }
      if (!renderer.xr.isPresenting) {
        renderer.render(scene, camera);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      scene.clear();
      mountRef.current?.removeChild(renderer.domElement);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Triggered on explicit user button click
  const startARSession = async () => {
    const xr = (navigator as Navigator & { xr?: any }).xr;
    if (!xr || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    try {
      setStatus('Starting AR session...');
      const sessionInit: any = {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay', 'local-floor'],
      };

      if (overlayRef.current) {
        sessionInit.domOverlay = { root: overlayRef.current };
      }

      const session = await xr.requestSession('immersive-ar', sessionInit);
      sessionRef.current = session;
      setIsSessionActive(true);
      setStatus('AR active — Scan floor to detect surfaces');

      const renderer = rendererRef.current;
      await renderer.xr.setReferenceSpaceType('local-floor');
      await renderer.xr.setSession(session);

      const referenceSpace = await session.requestReferenceSpace('local-floor');
      const viewerSpace = await session.requestReferenceSpace('viewer');

      if (typeof session.requestHitTestSource === 'function') {
        const hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
        hitTestSourceRef.current = hitTestSource;
      }

      session.addEventListener('end', () => {
        setIsSessionActive(false);
        hitTestSourceRef.current = null;
        sessionRef.current = null;
        if (reticleRef.current) reticleRef.current.visible = false;
        if (floorPlaneRef.current) floorPlaneRef.current.visible = false;
        setStatus('AR session ended');
      });

      renderer.setAnimationLoop((_, frame) => {
        if (!frame || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;

        if (hitTestSourceRef.current) {
          const hitTestResults = frame.getHitTestResults(hitTestSourceRef.current);
          if (hitTestResults.length > 0) {
            const pose = hitTestResults[0].getPose(referenceSpace);
            if (pose) {
              const hitMatrix = new THREE.Matrix4().fromArray(pose.transform.matrix);
              if (reticleRef.current) {
                reticleRef.current.position.setFromMatrixPosition(hitMatrix);
                reticleRef.current.quaternion.setFromRotationMatrix(hitMatrix);
                reticleRef.current.visible = true;
              }
              if (floorPlaneRef.current && reticleRef.current) {
                floorPlaneRef.current.visible = true;
                floorPlaneRef.current.position.copy(reticleRef.current.position);
              }
              if (reticleRef.current) {
                setCurrentReticle({
                  x: reticleRef.current.position.x,
                  y: reticleRef.current.position.y,
                  z: reticleRef.current.position.z,
                });
              }
            }
          } else {
            if (reticleRef.current) reticleRef.current.visible = false;
            if (floorPlaneRef.current) floorPlaneRef.current.visible = false;
          }
        }

        renderer.render(sceneRef.current, cameraRef.current);
      });
    } catch (sessionError: any) {
      const name = sessionError?.name ?? '';
      if (name === 'NotAllowedError') {
        setStatus('Camera permission denied — AR requires camera access');
      } else if (name === 'NotSupportedError') {
        setStatus('Required AR features (hit-test) not supported on this device');
      } else if (name === 'SecurityError') {
        setStatus('Secure context error: must be served over HTTPS');
      } else {
        setStatus(`AR session failed: ${sessionError?.message ?? 'unknown error'}`);
      }
      console.error('[AR] requestSession failed:', sessionError);
      setIsSessionActive(false);
    }
  };

  const drawPolygon = useCallback((nextCorners: CornerPoint[]) => {
    if (!polygonGroupRef.current) return;
    polygonGroupRef.current.clear();

    if (nextCorners.length < 2) return;

    const shape = new THREE.Shape();
    nextCorners.forEach((point, index) => {
      if (index === 0) {
        shape.moveTo(point.x, point.z);
      } else {
        shape.lineTo(point.x, point.z);
      }
    });
    shape.closePath();

    const geometry = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.02;
    polygonGroupRef.current.add(mesh);

    const linePoints = nextCorners.map((point) => new THREE.Vector3(point.x, point.y, point.z));
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    const polyLine = new THREE.LineLoop(
      lineGeometry,
      new THREE.LineBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.9 })
    );
    polygonGroupRef.current.add(polyLine);

    nextCorners.forEach((point) => {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, emissive: 0x22d3ee, emissiveIntensity: 0.6 })
      );
      sphere.position.set(point.x, point.y + 0.02, point.z);
      polygonGroupRef.current?.add(sphere);
    });
  }, []);

  useEffect(() => {
    drawPolygon(corners);
    onMetricsChange(corners);
  }, [corners, drawPolygon, onMetricsChange]);

  const markCorner = () => {
    if (!currentReticle) {
      setStatus('Move the reticle over a flat surface first');
      return;
    }
    const nextCorners = [...corners, currentReticle];
    setCorners(nextCorners);
    setStatus(`Corner ${nextCorners.length} marked`);
  };

  const undoLast = () => {
    setCorners((prev) => prev.slice(0, -1));
    setStatus('Last corner removed');
  };

  const reset = () => {
    setCorners([]);
    setCurrentReticle(null);
    setStatus('Measurement reset');
  };

  const completeAndSave = () => {
    onSave({
      room_name: roomName,
      room_type: roomType,
      method: 'ar_verified',
      measurement_status: 'ar_verified',
      corners,
      total_area_sq_m: areaMetrics.areaSqM,
      perimeter_m: areaMetrics.perimeterM,
      compliance: areaMetrics.isCompliant,
      required_min_sq_m: areaMetrics.requiredMinSqM,
      timestamp: Date.now(),
    });
  };

  return (
    <div
      ref={overlayRef}
      className="relative h-full w-full overflow-hidden bg-transparent"
    >
      <div ref={mountRef} className="absolute inset-0 bg-transparent" />

      {/* Start AR Session Button Banner */}
      {!isSessionActive && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/80 p-6 text-center backdrop-blur-sm">
          <div className="mb-4 rounded-full bg-cyan-500/10 p-4 ring-1 ring-cyan-500/30">
            <Camera className="h-8 w-8 text-cyan-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100">Ready for Room Measurement</h3>
          <p className="mt-1 max-w-xs text-xs text-slate-400">
            Tap below to activate the WebXR camera passthrough and start floor scanning.
          </p>
          <button
            type="button"
            onClick={startARSession}
            disabled={isARSupported === false}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-6 py-3 text-sm font-bold text-slate-950 transition-all hover:bg-cyan-400 active:scale-95 disabled:opacity-40"
          >
            <Camera className="h-4 w-4" />
            Start AR Session
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between p-3">
        <div className="rounded-full border border-slate-600/80 bg-slate-950/70 px-3 py-1.5 text-[10px] uppercase tracking-[0.3em] text-slate-200">
          {roomName}
        </div>
        <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.3em] text-cyan-200">
          {isSessionActive ? 'WebXR AR Active' : isARSupported ? 'Ready' : 'AR Unsupported'}
        </div>
      </div>

      {/* Center Reticle Coordinate Indicator */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        {currentReticle ? (
          <div className="flex items-center justify-center rounded-full border border-cyan-400/70 bg-cyan-500/20 px-3 py-1 text-[10px] font-mono text-cyan-100 shadow-lg backdrop-blur-md">
            X: {currentReticle.x.toFixed(2)}m | Z: {currentReticle.z.toFixed(2)}m
          </div>
        ) : null}
      </div>

      {/* Live Measurement & Control Card */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-4">
        <div className="rounded-3xl border border-slate-700/80 bg-slate-950/80 p-4 backdrop-blur-xl shadow-2xl">
          <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-slate-400">
            <span>Live Metrics</span>
            <span
              className={`inline-flex items-center gap-1 font-semibold ${areaMetrics.isCompliant ? 'text-emerald-300' : 'text-amber-300'
                }`}
            >
              {areaMetrics.isCompliant ? <Check className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
              {areaMetrics.isCompliant ? 'Compliant' : 'Deficient'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm text-slate-100">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-2.5">
              <span className="block text-[10px] uppercase tracking-[0.2em] text-slate-400">Corners</span>
              <span className="mt-1 block text-xl font-semibold">{corners.length}</span>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-2.5">
              <span className="block text-[10px] uppercase tracking-[0.2em] text-slate-400">Area</span>
              <span className="mt-1 block text-xl font-semibold">{areaMetrics.areaSqM.toFixed(2)} m²</span>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-2.5">
              <span className="block text-[10px] uppercase tracking-[0.2em] text-slate-400">Perimeter</span>
              <span className="mt-1 block text-xl font-semibold">{areaMetrics.perimeterM.toFixed(2)} m</span>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-2.5">
              <span className="block text-[10px] uppercase tracking-[0.2em] text-slate-400">Status</span>
              <span className="mt-1 block text-base font-semibold text-emerald-300">
                {areaMetrics.isCompliant ? 'Pass' : 'Review'}
              </span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={markCorner}
              className="rounded-2xl bg-cyan-500 px-3 py-2.5 text-sm font-semibold text-slate-950 transition-all hover:bg-cyan-400 active:scale-95"
            >
              Mark Corner
            </button>
            <button
              type="button"
              onClick={undoLast}
              className="rounded-2xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm font-semibold text-slate-100 transition-all active:scale-95"
            >
              <span className="inline-flex items-center gap-1">
                <Undo2 className="h-4 w-4" />
                Undo
              </span>
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-2xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm font-semibold text-slate-100 transition-all active:scale-95"
            >
              <span className="inline-flex items-center gap-1">
                <X className="h-4 w-4" />
                Reset
              </span>
            </button>
            <button
              type="button"
              onClick={completeAndSave}
              className="rounded-2xl bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-slate-950 transition-all hover:bg-emerald-400 active:scale-95"
            >
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Save
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Status Pill */}
      <div className="pointer-events-none absolute bottom-36 left-4 z-10 rounded-full border border-slate-700 bg-slate-950/80 px-3 py-2 text-[10px] uppercase tracking-[0.24em] text-slate-300 backdrop-blur-md">
        {status}
      </div>
    </div>
  );
}