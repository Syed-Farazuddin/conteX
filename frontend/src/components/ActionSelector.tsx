"use client";

import { actionList, type ActionKey } from "@/lib/actions";

const categoryOrder = [
  "segmentation",
  "composite",
  "frame",
  "color",
  "transform",
] as const;

const categoryLabels: Record<(typeof categoryOrder)[number], string> = {
  segmentation: "Cutout",
  composite: "Composite",
  frame: "Frame & size",
  color: "Color",
  transform: "Transform",
};

type ActionSelectorProps = {
  value: ActionKey;
  onChange: (key: ActionKey) => void;
  disabled?: boolean;
};

export default function ActionSelector({
  value,
  onChange,
  disabled = false,
}: ActionSelectorProps) {
  return (
    <div className="w-full space-y-4">
      <p className="text-center text-xs font-medium uppercase tracking-wider text-white/40">
        Processing action
      </p>
      {categoryOrder.map((category) => {
        const items = actionList.filter((a) => a.category === category);
        if (items.length === 0) return null;

        return (
          <div key={category} className="space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-widest text-white/30">
              {categoryLabels[category]}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {items.map((action) => {
                const selected = value === action.key;
                return (
                  <button
                    key={action.key}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(action.key)}
                    title={action.description}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition sm:px-4 sm:py-2 sm:text-sm ${
                      selected
                        ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/50"
                        : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80"
                    } disabled:opacity-50`}
                  >
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
