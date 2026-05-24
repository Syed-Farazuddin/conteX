"use client";

import { DEFAULT_SUBJECT_TILT, type SubjectTilt } from "@/lib/actions";

type SubjectTiltControlsProps = {
  value: SubjectTilt;
  onChange: (tilt: SubjectTilt) => void;
  disabled?: boolean;
};

export default function SubjectTiltControls({
  value,
  onChange,
  disabled = false,
}: SubjectTiltControlsProps) {
  const update = <K extends keyof SubjectTilt>(key: K, raw: string) => {
    const num = Number(raw) || 0;
    if (key === "degrees") {
      onChange({ ...value, degrees: Math.min(18, Math.max(-18, num)) });
      return;
    }
    if (key === "offsetX") {
      onChange({ ...value, offsetX: Math.min(120, Math.max(-120, num)) });
      return;
    }
    onChange({ ...value, offsetY: Math.min(120, Math.max(-120, num)) });
  };

  const tiltHint =
    value.degrees < 0
      ? "Tilting left"
      : value.degrees > 0
        ? "Tilting right"
        : "No tilt";

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-white/40">
          Subject tilt & position
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange({ ...DEFAULT_SUBJECT_TILT })}
          className="text-xs text-cyan-400/80 hover:text-cyan-300 disabled:opacity-50"
        >
          Reset
        </button>
      </div>

      <label className="mb-4 block">
        <div className="mb-2 flex justify-between text-xs text-white/50">
          <span>Tilt ({tiltHint})</span>
          <span className="font-mono text-cyan-300/90">{value.degrees}°</span>
        </div>
        <input
          type="range"
          min={-18}
          max={18}
          step={0.5}
          disabled={disabled}
          value={value.degrees}
          onChange={(e) => update("degrees", e.target.value)}
          className="w-full accent-cyan-400"
        />
        <div className="mt-1 flex justify-between text-[10px] text-white/30">
          <span>← Left</span>
          <span>Right →</span>
        </div>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-white/50">Shift X (px)</span>
          <input
            type="number"
            min={-120}
            max={120}
            disabled={disabled}
            value={value.offsetX}
            onChange={(e) => update("offsetX", e.target.value)}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-white/50">Shift Y (px)</span>
          <input
            type="number"
            min={-120}
            max={120}
            disabled={disabled}
            value={value.offsetY}
            onChange={(e) => update("offsetY", e.target.value)}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
          />
        </label>
      </div>
      <p className="mt-2 text-center text-[11px] text-white/35">
        Negative degrees tilt you left; positive tilts right. Shift moves you
        after tilt.
      </p>
    </div>
  );
}
