import { BadgeCheck, Gauge, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ARMeasurementView, type CornerPoint } from './components/ARMeasurementView';
import { ManualFallbackView } from './components/ManualFallbackView';
import { calculateAreaMetrics, type RoomType } from './hooks/useAreaMath';
import { useGeolocation } from './hooks/useGeolocation';

const roomOptions = [
  { name: 'Classroom 101', type: 'classroom' as const },
  { name: 'Computer Lab A', type: 'lab' as const },
  { name: 'Workshop 2', type: 'lab' as const },
  { name: 'Classroom 204', type: 'classroom' as const }
];

interface SavedMeasurement {
  room_name: string;
  room_type: RoomType;
  method: 'ar_verified' | 'manually_entered';
  measurement_status: 'ar_verified' | 'manually_entered';
  corners?: CornerPoint[];
  total_area_sq_m: number;
  perimeter_m?: number;
  compliance?: boolean;
  required_min_sq_m?: number;
  timestamp: number;
  gps?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  }[];
  dimensions?: { length_m: number; width_m: number };
}

export default function App() {
  const [selectedRoomName, setSelectedRoomName] = useState(roomOptions[0].name);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType>(roomOptions[0].type);
  const [isARSupported, setIsARSupported] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState({ corners: 0, areaSqM: 0, perimeterM: 0, isCompliant: false, roomType: selectedRoomType });
  const [lastSavedRecord, setLastSavedRecord] = useState<SavedMeasurement | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const geolocation = useGeolocation();

  useEffect(() => {
    const checkARSupport = async () => {
      const isSecure = window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      const xr = (navigator as Navigator & { xr?: { isSessionSupported?: (mode: string) => Promise<boolean> } }).xr;
      
      if (!isSecure || !xr || typeof xr.isSessionSupported !== 'function') {
        setIsARSupported(false);
        return;
      }

      try {
        const supported = await xr.isSessionSupported('immersive-ar');
        setIsARSupported(supported);
      } catch (err) {
        console.error('AR support check failed:', err);
        setIsARSupported(false);
      }
    };

    checkARSupport();
  }, []);

  useEffect(() => {
    const matchingRoom = roomOptions.find((option) => option.name === selectedRoomName) ?? roomOptions[0];
    setSelectedRoomType(matchingRoom.type);
  }, [selectedRoomName]);

  useEffect(() => {
    setLiveMetrics((prev) => ({ ...prev, roomType: selectedRoomType }));
  }, [selectedRoomType]);

  const roomTypeLabel = selectedRoomType === 'classroom' ? 'Classroom' : 'Lab';

  const complianceSummary = useMemo(() => {
    const threshold = selectedRoomType === 'classroom' ? 66 : 132;
    return liveMetrics.areaSqM >= threshold ? 'Compliant' : 'Deficient';
  }, [liveMetrics.areaSqM, selectedRoomType]);

  const handleMeasurementUpdate = (points: CornerPoint[]) => {
    const metrics = calculateAreaMetrics(points, selectedRoomType);
    setLiveMetrics({
      corners: points.length,
      areaSqM: metrics.areaSqM,
      perimeterM: metrics.perimeterM,
      isCompliant: metrics.isCompliant,
      roomType: selectedRoomType
    });
  };

  const handleSave = (payload: Record<string, unknown>) => {
    const gpsTrace = geolocation.samples.map((sample) => ({
      latitude: sample.latitude,
      longitude: sample.longitude,
      accuracy: sample.accuracy,
      timestamp: sample.timestamp
    }));

    const record: SavedMeasurement = {
      room_name: String(payload.room_name ?? selectedRoomName),
      room_type: (payload.room_type as RoomType) ?? selectedRoomType,
      method: (payload.method as SavedMeasurement['method']) ?? 'ar_verified',
      measurement_status: (payload.measurement_status as SavedMeasurement['measurement_status']) ?? 'ar_verified',
      total_area_sq_m: Number(payload.total_area_sq_m ?? liveMetrics.areaSqM),
      perimeter_m: payload.perimeter_m ? Number(payload.perimeter_m) : liveMetrics.perimeterM,
      compliance: Boolean(payload.compliance ?? liveMetrics.isCompliant),
      required_min_sq_m: payload.required_min_sq_m ? Number(payload.required_min_sq_m) : selectedRoomType === 'classroom' ? 66 : 132,
      timestamp: Date.now(),
      gps: gpsTrace,
      corners: payload.corners ? (payload.corners as CornerPoint[]) : undefined,
      dimensions: payload.dimensions as { length_m: number; width_m: number } | undefined
    };

    setLastSavedRecord(record);
    setShowSummary(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-3 md:p-5">
      <div className="w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-700/80 bg-slate-900/60 shadow-[0_30px_90px_rgba(2,6,23,0.7)] backdrop-blur-2xl">
        <header className="flex items-center justify-between border-b border-slate-700/80 bg-slate-950/55 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Module 3</p>
              <h1 className="text-lg font-semibold text-white">Digital Dimension Tracking</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <label className="rounded-xl border border-slate-700 bg-slate-900/80 px-2 py-1.5 text-sm text-slate-200">
              <select value={selectedRoomName} onChange={(event) => setSelectedRoomName(event.target.value)} className="bg-transparent outline-none">
                {roomOptions.map((option) => (
                  <option key={option.name} value={option.name} className="bg-slate-950 text-white">
                    {option.name}
                  </option>
                ))}
              </select>
            </label>

            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.2em] ${
              geolocation.status === 'error'
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
            }`} title={geolocation.error ?? undefined}>
              <MapPin className="h-3.5 w-3.5" />
              {geolocation.status === 'live'
                ? 'Live GPS'
                : geolocation.status === 'locked'
                  ? 'GPS Locked'
                  : geolocation.errorCode === 'PERMISSION_DENIED'
                    ? 'Denied — check settings'
                    : geolocation.errorCode === 'POSITION_UNAVAILABLE'
                      ? 'GPS optional — weak signal'
                      : geolocation.errorCode === 'TIMEOUT'
                        ? 'GPS slow — retrying'
                        : geolocation.error
                          ? 'GPS unavailable'
                          : 'Awaiting GPS'}
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              {isARSupported ? 'WebXR AR' : 'Manual'}
            </div>
          </div>
        </header>

        <main className="flex flex-col gap-4 p-4 md:p-6">
          <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
            <div className="h-[68vh] min-h-[520px]">
              {isARSupported ? (
                <ARMeasurementView
                  roomName={selectedRoomName}
                  roomType={selectedRoomType}
                  onSave={handleSave}
                  onMetricsChange={handleMeasurementUpdate}
                />
              ) : (
                <ManualFallbackView roomName={selectedRoomName} onSave={handleSave} />
              )}
            </div>

            <aside className="flex flex-col gap-4 rounded-[28px] border border-slate-700/80 bg-slate-950/65 p-4 backdrop-blur-xl">
              <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Survey snapshot</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">{selectedRoomName}</h2>
                <p className="mt-1 text-sm text-slate-300">{roomTypeLabel} compliance check</p>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-3">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-[10px] uppercase tracking-[0.2em]">Corners marked</span>
                    <Gauge className="h-4 w-4 text-cyan-300" />
                  </div>
                  <div className="mt-2 text-3xl font-semibold text-white">{liveMetrics.corners}</div>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-3">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-[10px] uppercase tracking-[0.2em]">Area</span>
                    <BadgeCheck className="h-4 w-4 text-emerald-300" />
                  </div>
                  <div className="mt-2 text-3xl font-semibold text-white">{liveMetrics.areaSqM.toFixed(2)} m²</div>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-3">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-[10px] uppercase tracking-[0.2em]">Perimeter</span>
                    <ShieldCheck className="h-4 w-4 text-cyan-300" />
                  </div>
                  <div className="mt-2 text-3xl font-semibold text-white">{liveMetrics.perimeterM.toFixed(2)} m</div>
                </div>
              </div>

              <div className={`rounded-2xl border p-3 text-sm ${liveMetrics.isCompliant ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100' : 'border-amber-500/40 bg-amber-500/10 text-amber-100'}`}>
                <div className="text-[10px] uppercase tracking-[0.2em]">Compliance badge</div>
                <div className="mt-2 text-xl font-semibold">{complianceSummary}</div>
                <div className="mt-1 text-xs opacity-80">Threshold: {selectedRoomType === 'classroom' ? '66 m²' : '132 m²'}</div>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-3 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="uppercase tracking-[0.2em] text-slate-400">GPS status</span>
                  <span className="font-medium text-cyan-200">{geolocation.status}</span>
                </div>
                {geolocation.position ? (
                  <div className="mt-2 space-y-1">
                    <div>Lat: {geolocation.position.coords.latitude.toFixed(6)}</div>
                    <div>Lng: {geolocation.position.coords.longitude.toFixed(6)}</div>
                    <div>Accuracy: ±{geolocation.position.coords.accuracy.toFixed(0)} m</div>
                  </div>
                ) : (
                  <div className="mt-2 text-slate-400">Waiting for GPS lock...</div>
                )}
              </div>
            </aside>
          </div>
        </main>
      </div>

      {showSummary && lastSavedRecord ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-slate-700 bg-slate-950/95 p-5 shadow-2xl shadow-slate-950/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-300">Inspection summary</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{lastSavedRecord.room_name}</h3>
              </div>
              <button type="button" onClick={() => setShowSummary(false)} className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200">
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Measurement status</div>
                <div className="mt-2 text-xl font-semibold text-white">{lastSavedRecord.measurement_status}</div>
                <div className="mt-4 space-y-2 text-sm text-slate-300">
                  <div>Total area: {lastSavedRecord.total_area_sq_m.toFixed(2)} m²</div>
                  <div>Perimeter: {lastSavedRecord.perimeter_m?.toFixed(2) ?? '0.00'} m</div>
                  <div>Compliance: {lastSavedRecord.compliance ? 'Pass' : 'Needs review'}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">GPS trace</div>
                <div className="mt-2 text-sm text-slate-300">
                  {lastSavedRecord.gps && lastSavedRecord.gps.length > 0 ? (
                    <>
                      <div>Samples: {lastSavedRecord.gps.length}</div>
                      <div>Latest lat: {lastSavedRecord.gps[lastSavedRecord.gps.length - 1].latitude.toFixed(6)}</div>
                      <div>Latest lng: {lastSavedRecord.gps[lastSavedRecord.gps.length - 1].longitude.toFixed(6)}</div>
                    </>
                  ) : (
                    <div>No GPS trace available</div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">JSON payload preview</div>
              <pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs text-cyan-100">
                {JSON.stringify(lastSavedRecord, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
