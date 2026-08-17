import { Building2, Compass, Ruler, Save, SquareStack } from 'lucide-react';
import { useMemo, useState } from 'react';

interface ManualFallbackViewProps {
  roomName: string;
  onSave: (payload: Record<string, unknown>) => void;
}

export function ManualFallbackView({ roomName, onSave }: ManualFallbackViewProps) {
  const [length, setLength] = useState('8');
  const [width, setWidth] = useState('6');
  const [directArea, setDirectArea] = useState('48');
  const [mode, setMode] = useState<'dimensions' | 'area'>('dimensions');

  const computedArea = useMemo(() => {
    if (mode === 'dimensions') {
      const parsedLength = Number(length) || 0;
      const parsedWidth = Number(width) || 0;
      return parsedLength * parsedWidth;
    }

    return Number(directArea) || 0;
  }, [directArea, length, mode, width]);

  const payload = useMemo(
    () => ({
      room_name: roomName,
      method: 'manual',
      measurement_status: 'manually_entered',
      room_type: 'classroom',
      dimensions: {
        length_m: Number(length) || 0,
        width_m: Number(width) || 0
      },
      total_area_sq_m: computedArea,
      timestamp: Date.now()
    }),
    [computedArea, length, roomName, width]
  );

  return (
    <div className="flex h-full flex-col gap-5 rounded-3xl border border-slate-700/70 bg-slate-950/70 p-4 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-300/80">Mode</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Manual Measurement</h3>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-200">
          <Compass className="h-4 w-4" />
          Fallback
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4">
        <div className="flex gap-2 rounded-full border border-slate-700 bg-slate-800/80 p-1">
          <button
            type="button"
            onClick={() => setMode('dimensions')}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${
              mode === 'dimensions' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'
            }`}
          >
            Length × Width
          </button>
          <button
            type="button"
            onClick={() => setMode('area')}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${
              mode === 'area' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'
            }`}
          >
            Direct m²
          </button>
        </div>

        {mode === 'dimensions' ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="rounded-2xl border border-slate-700 bg-slate-950/50 p-3">
              <span className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                <Ruler className="h-3.5 w-3.5" />
                Length (m)
              </span>
              <input
                value={length}
                onChange={(event) => setLength(event.target.value)}
                type="number"
                min="0"
                step="0.1"
                className="w-full bg-transparent text-lg font-semibold text-white outline-none"
              />
            </label>
            <label className="rounded-2xl border border-slate-700 bg-slate-950/50 p-3">
              <span className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                <SquareStack className="h-3.5 w-3.5" />
                Width (m)
              </span>
              <input
                value={width}
                onChange={(event) => setWidth(event.target.value)}
                type="number"
                min="0"
                step="0.1"
                className="w-full bg-transparent text-lg font-semibold text-white outline-none"
              />
            </label>
          </div>
        ) : (
          <label className="rounded-2xl border border-slate-700 bg-slate-950/50 p-3">
            <span className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
              <Building2 className="h-3.5 w-3.5" />
              Area (m²)
            </span>
            <input
              value={directArea}
              onChange={(event) => setDirectArea(event.target.value)}
              type="number"
              min="0"
              step="0.1"
              className="w-full bg-transparent text-lg font-semibold text-white outline-none"
            />
          </label>
        )}

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-sm text-cyan-100">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Calculated area</span>
            <span className="text-xl font-bold text-white">{computedArea.toFixed(2)} m²</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSave(payload)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          <Save className="h-4 w-4" />
          Save Manual Room Record
        </button>
      </div>
    </div>
  );
}
