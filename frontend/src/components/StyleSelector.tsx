"use client";

import type { GenerationStyle } from "@/lib/api/generate";

type StyleSelectorProps = {
  styles: GenerationStyle[];
  value: string;
  onChange: (styleId: string) => void;
  disabled?: boolean;
};

export default function StyleSelector({
  styles,
  value,
  onChange,
  disabled = false,
}: StyleSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {styles.map((style) => {
        const selected = value === style.id;
        return (
          <button
            key={style.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(style.id)}
            className={`rounded-2xl border px-3 py-3 text-left transition ${
              selected
                ? "border-violet-400/50 bg-linear-to-br from-violet-500/20 to-fuchsia-500/10 ring-1 ring-violet-400/40"
                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"
            } disabled:opacity-50`}
          >
            <span className="text-xl" aria-hidden>
              {style.emoji}
            </span>
            <p className="mt-1 text-sm font-semibold text-white">
              {style.label}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-white/45">
              {style.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
