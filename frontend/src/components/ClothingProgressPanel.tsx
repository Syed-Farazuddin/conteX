"use client";

import type { ClothingRenderResult } from "@/lib/api/clothing";

export type ClothingPhase = "analyzing-style" | "generating" | "done";

const STEPS: { phase: ClothingPhase; label: string }[] = [
  { phase: "analyzing-style", label: "Analyzing garment (OpenAI)" },
  { phase: "generating", label: "Generating on-model scene (Replicate)" },
];

type ClothingProgressPanelProps = {
  phase: ClothingPhase;
  result: ClothingRenderResult | null;
  error?: string | null;
};

export default function ClothingProgressPanel({
  phase,
  result,
  error,
}: ClothingProgressPanelProps) {
  const activeIndex = STEPS.findIndex((s) => s.phase === phase);

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/40">
        Clothing cinematic pipeline
        <span className="ml-2 normal-case tracking-normal text-amber-300/80">
          · typically 2–5 min
        </span>
      </p>

      {error && (
        <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      <ol className="space-y-2">
        {STEPS.map((step, index) => {
          const done = phase === "done" || activeIndex > index;
          const active = step.phase === phase && phase !== "done";
          return (
            <li
              key={step.phase}
              className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm ${
                done
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : active
                    ? "border-amber-400/40 bg-amber-500/10"
                    : "border-white/10 bg-white/5"
              }`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  done
                    ? "bg-emerald-500 text-black"
                    : active
                      ? "animate-pulse bg-amber-400 text-black"
                      : "bg-white/10 text-white/50"
                }`}
              >
                {done ? "✓" : index + 1}
              </span>
              <span className={done ? "text-white/90" : "text-white/55"}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      {result && (
        <div className="mt-4 space-y-2 rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/5 p-3 text-sm">
          <p className="text-fuchsia-200/90">
            <span className="text-white/45">Garment:</span>{" "}
            {result.style.garmentType}
          </p>
          <p className="text-white/55">
            <span className="text-white/45">Palette:</span>{" "}
            {result.style.dominantColors.join(", ")}
          </p>
          <p className="text-white/55">
            <span className="text-white/45">Scene:</span>{" "}
            {result.style.suggestedBackground}
          </p>
          <p className="text-white/55 line-clamp-4">
            <span className="text-white/45">Prompt sent:</span>{" "}
            {result.cinematicPrompt}
          </p>
        </div>
      )}
    </div>
  );
}
