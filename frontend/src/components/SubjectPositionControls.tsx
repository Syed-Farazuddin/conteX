"use client";

import { DEFAULT_SUBJECT_POSITION, type SubjectPosition } from "@/lib/actions";

type SubjectPositionControlsProps = {
  value: SubjectPosition;
  onChange: (position: SubjectPosition) => void;
  disabled?: boolean;
};

const fields: { key: keyof SubjectPosition; label: string }[] = [
  { key: "top", label: "Top" },
  { key: "left", label: "Left" },
  { key: "right", label: "Right" },
  { key: "bottom", label: "Bottom" },
];

export default function SubjectPositionControls({
  value,
  onChange,
  disabled = false,
}: SubjectPositionControlsProps) {
  const update = (key: keyof SubjectPosition, raw: string) => {
    const num = Math.min(45, Math.max(0, Number(raw) || 0));
    onChange({ ...value, [key]: num });
  };

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-white/40">
          Subject position (% inset)
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange({ ...DEFAULT_SUBJECT_POSITION })}
          className="text-xs text-cyan-400/80 hover:text-cyan-300 disabled:opacity-50"
        >
          Reset
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {fields.map(({ key, label }) => (
          <label key={key} className="flex flex-col gap-1">
            <span className="text-xs text-white/50">{label}</span>
            <input
              type="number"
              min={0}
              max={45}
              disabled={disabled}
              value={value[key]}
              onChange={(e) => update(key, e.target.value)}
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
            />
          </label>
        ))}
      </div>
      <p className="mt-2 text-center text-[11px] text-white/35">
        Insets define the placement box — subject anchors to the bottom by
        default
      </p>
    </div>
  );
}
