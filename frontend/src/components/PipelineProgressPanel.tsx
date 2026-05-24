"use client";

import { actionMap } from "@/lib/actions";
import type { PipelinePlanMeta } from "@/lib/api/pipeline";
import type { PipelinePlan, PipelineProgress } from "@/lib/api/pipeline-types";

type PipelineProgressPanelProps = {
  plan: PipelinePlan | null;
  progress: PipelineProgress | null;
  phase: "analyzing" | "running" | "done";
  meta?: PipelinePlanMeta | null;
};

export default function PipelineProgressPanel({
  plan,
  progress,
  phase,
  meta,
}: PipelineProgressPanelProps) {
  if (!plan && phase === "analyzing") {
    return (
      <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">
          AI is analyzing your image…
        </p>
        <p className="text-sm text-white/50">
          Deciding the best edits for a beautiful, meaningful result.
        </p>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/40">
        AI edit pipeline
        {meta && (
          <span
            className={`ml-2 normal-case tracking-normal ${
              meta.pipelineSource === "mock"
                ? "text-amber-400"
                : "text-emerald-400/80"
            }`}
          >
            · {meta.pipelineSource === "mock" ? "mock plan" : "OpenAI live"} ·
            id {meta.planId.slice(0, 8)} ·{" "}
            {new Date(meta.generatedAt).toLocaleTimeString()}
          </span>
        )}
      </p>
      <p className="mb-4 text-sm text-cyan-200/80">{plan.summary}</p>
      <ol className="space-y-2">
        {plan.actions.map((step, index) => {
          const done =
            progress &&
            (progress.stepIndex > index ||
              (phase === "done" &&
                progress.completed.length === plan.actions.length));
          const active = progress?.stepIndex === index && phase === "running";
          const label =
            step.action in actionMap
              ? actionMap[step.action as keyof typeof actionMap].label
              : step.action;

          return (
            <li
              key={`${step.action}-${index}`}
              className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm ${
                done
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : active
                    ? "border-cyan-400/40 bg-cyan-500/10"
                    : "border-white/10 bg-white/5"
              }`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  done
                    ? "bg-emerald-500 text-black"
                    : active
                      ? "animate-pulse bg-cyan-400 text-black"
                      : "bg-white/10 text-white/50"
                }`}
              >
                {done ? "✓" : index + 1}
              </span>
              <div>
                <p className="font-medium text-white/90">{label}</p>
                {step.reason && (
                  <p className="text-xs text-white/45">{step.reason}</p>
                )}
                {step.action === "add-background" &&
                  step.params?.backgroundScene && (
                    <p className="mt-1 text-xs text-violet-300/70">
                      Background: {step.params.backgroundScene}
                      {step.params.backgroundSource && (
                        <span className="text-violet-300/50">
                          {" "}
                          · via {step.params.backgroundSource}
                        </span>
                      )}
                    </p>
                  )}
                {step.action === "adjust-enhance" &&
                  step.params?.brightness != null && (
                    <p className="mt-1 text-xs text-white/35">
                      Enhance: brightness {step.params.brightness} · contrast{" "}
                      {step.params.contrast} · saturation{" "}
                      {step.params.saturation}
                    </p>
                  )}
                {step.action === "tilt-subject" && step.params?.tilt && (
                  <p className="mt-1 text-xs text-white/35">
                    Tilt: {step.params.tilt.degrees}°
                  </p>
                )}
                {step.action === "add-background" && step.params?.position && (
                  <p className="mt-1 text-xs text-white/35">
                    Placement: {step.params.position.verticalAlign ?? "bottom"}
                    -aligned · insets T{step.params.position.top} L
                    {step.params.position.left} R{step.params.position.right} B
                    {step.params.position.bottom}
                  </p>
                )}
                {active && !done && (
                  <p className="mt-1 text-xs text-cyan-300/80">Running…</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
