import { blobUrlToBase64 } from "./pipeline";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type ClothingStyleAnalysis = {
  garmentType: string;
  dominantColors: string[];
  style: string;
  mood: string;
  suggestedBackground: string;
  modelGender: "male" | "female";
};

export type ClothingRenderResult = {
  /** Original upload (no background removal). */
  sourceImageUrl: string;
  outputUrl: string;
  style: ClothingStyleAnalysis;
  cinematicPrompt: string;
  /** Exact `input` object sent to Replicate (image field summarized). */
  replicateInput: Record<string, unknown>;
  generatedAt: string;
  /** @deprecated Use sourceImageUrl */
  cutoutUrl?: string;
};

export async function renderClothingFromFile(
  imageBlobUrl: string,
  options?: { aspectRatio?: string; prompt?: string },
): Promise<ClothingRenderResult> {
  const imageBase64 = await blobUrlToBase64(imageBlobUrl);

  const res = await fetch(`${API_BASE}/api/clothing/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      imageBase64,
      aspectRatio: options?.aspectRatio ?? "3:4",
      ...(options?.prompt ? { prompt: options.prompt } : {}),
    }),
  });

  const body = (await res.json()) as {
    success: boolean;
    data?: ClothingRenderResult;
    message?: string;
  };

  if (!res.ok || !body.success || !body.data) {
    throw new Error(body.message ?? "Clothing render failed");
  }

  return body.data;
}

export async function fetchClothingStatus(): Promise<{
  configured: boolean;
}> {
  const res = await fetch(`${API_BASE}/api/clothing/status`, {
    cache: "no-store",
  });
  const body = (await res.json()) as { configured?: boolean };
  return { configured: Boolean(body.configured) };
}
