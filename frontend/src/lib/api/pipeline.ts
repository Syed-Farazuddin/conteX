import type { PipelinePlan } from "./pipeline-types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type PipelinePlanMeta = {
  pipelineSource: "openai" | "mock";
  planId: string;
  generatedAt: string;
};

export type PipelinePlanResponse = {
  plan: PipelinePlan;
  meta: PipelinePlanMeta;
};

export async function fetchPipelinePlan(
  imageBase64: string,
): Promise<PipelinePlanResponse> {
  const res = await fetch(`${API_BASE}/api/ai/plan-pipeline`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ imageBase64 }),
  });

  const body = (await res.json()) as {
    success: boolean;
    data?: PipelinePlan;
    meta?: PipelinePlanMeta;
    message?: string;
  };

  if (!res.ok || !body.success || !body.data) {
    throw new Error(body.message ?? "Failed to fetch AI pipeline plan");
  }

  if (!body.meta?.planId || !body.meta?.pipelineSource) {
    throw new Error(
      "Backend returned a plan without meta.planId — restart the backend (old build may still be running)",
    );
  }

  return {
    plan: body.data,
    meta: body.meta,
  };
}

export async function blobUrlToBase64(blobUrl: string): Promise<string> {
  const res = await fetch(blobUrl);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(blob);
  });
}

export type { PipelinePlan, PipelineStep, PipelineProgress } from "./pipeline-types";
