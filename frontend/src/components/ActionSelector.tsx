"use client";

import { useState } from "react";
import { actionList, type ActionKey } from "@/lib/actions";

const AI_ACTION_KEY: ActionKey = "ai-auto-edit";
const CLOTHING_ACTION_KEY: ActionKey = "clothing-cinematic";

const MANUAL_ACTION_ORDER: ActionKey[] = [
  "clear-background",
  "add-background",
  "adjust-enhance",
  "tilt-subject",
  "crop-16-9",
  "crop-9-16",
  "crop-1-1",
  "resize-1080p",
  "resize-vertical",
  "rotate-90",
  "flip-horizontal",
];

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
  const isAi = value === AI_ACTION_KEY;
  const isClothing = value === CLOTHING_ACTION_KEY;
  const [showManual, setShowManual] = useState(false);

  const aiAction = actionList.find((a) => a.key === AI_ACTION_KEY);
  const clothingAction = actionList.find((a) => a.key === CLOTHING_ACTION_KEY);
  const manualActions = MANUAL_ACTION_ORDER.map((key) =>
    actionList.find((a) => a.key === key),
  ).filter(Boolean);

  return (
    <div className="w-full space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {aiAction && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(AI_ACTION_KEY)}
            className={`rounded-2xl border px-4 py-3.5 text-left transition ${
              isAi
                ? "border-violet-400/50 bg-linear-to-r from-violet-500/20 to-fuchsia-500/15 ring-1 ring-violet-400/40"
                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"
            } disabled:opacity-50`}
          >
            <p className="text-sm font-semibold text-white">{aiAction.label}</p>
            <p className="mt-0.5 text-xs text-white/45">
              {aiAction.description}
            </p>
            {isAi && (
              <span className="mt-2 inline-block rounded-full bg-violet-500/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-violet-200">
                Portraits
              </span>
            )}
          </button>
        )}

        {clothingAction && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(CLOTHING_ACTION_KEY)}
            className={`rounded-2xl border px-4 py-3.5 text-left transition ${
              isClothing
                ? "border-amber-400/50 bg-linear-to-r from-amber-500/15 to-orange-500/10 ring-1 ring-amber-400/40"
                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"
            } disabled:opacity-50`}
          >
            <p className="text-sm font-semibold text-white">
              {clothingAction.label}
            </p>
            <p className="mt-0.5 text-xs text-white/45">
              {clothingAction.description}
            </p>
            {isClothing && (
              <span className="mt-2 inline-block rounded-full bg-amber-500/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-200">
                Replicate
              </span>
            )}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-[10px] font-medium uppercase tracking-widest text-white/30">
          Manual tools
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowManual((open) => !open)}
          className="text-[11px] text-white/40 transition hover:text-white/70 disabled:opacity-50"
        >
          {showManual ? "Hide" : "Show"}
        </button>
      </div>

      {showManual && (
        <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-white/10 bg-black/20 p-2 sm:grid-cols-4">
          {manualActions.map((action) => {
            if (!action) return null;
            const selected = value === action.key;
            return (
              <button
                key={action.key}
                type="button"
                disabled={disabled}
                onClick={() => onChange(action.key)}
                title={action.description}
                className={`rounded-lg px-2 py-2 text-center text-[11px] font-medium leading-tight transition ${
                  selected
                    ? "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-400/40"
                    : "bg-white/5 text-white/55 hover:bg-white/10 hover:text-white/80"
                } disabled:opacity-50`}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
