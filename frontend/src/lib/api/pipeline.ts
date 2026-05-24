import type { PipelinePlan } from "./pipeline-types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function fetchPipelinePlan(
  imageBase64: string,
): Promise<PipelinePlan> {
  const res = await fetch(`${API_BASE}/api/ai/plan-pipeline`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64 }),
  });

  const body = (await res.json()) as {
    success: boolean;
    data?: PipelinePlan;
    message?: string;
  };

  if (!res.ok || !body.success || !body.data) {
    throw new Error(body.message ?? "Failed to fetch AI pipeline plan");
  }

  return body.data;
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
