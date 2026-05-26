import { blobUrlToBase64 } from "./pipeline";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type GenerationStyle = {
  id: string;
  label: string;
  description: string;
  emoji: string;
  aspectRatio: string;
  pipeline: "image" | "clothing";
};

export type GenerationResult = {
  styleId: string;
  styleLabel: string;
  sourceImageUrl: string;
  outputUrl: string;
  prompt: string;
  replicateInput: Record<string, unknown>;
  generatedAt: string;
};

export async function fetchGenerationStyles(): Promise<{
  configured: boolean;
  styles: GenerationStyle[];
}> {
  const res = await fetch(`${API_BASE}/api/generate/styles`, {
    cache: "no-store",
  });
  const body = (await res.json()) as {
    configured?: boolean;
    styles?: GenerationStyle[];
  };
  return {
    configured: Boolean(body.configured),
    styles: body.styles ?? [],
  };
}

export async function generateFromFile(
  imageBlobUrl: string,
  styleId: string,
  options?: { aspectRatio?: string; prompt?: string },
): Promise<GenerationResult> {
  const imageBase64 = await blobUrlToBase64(imageBlobUrl);

  const res = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      styleId,
      imageBase64,
      ...(options?.aspectRatio ? { aspectRatio: options.aspectRatio } : {}),
      ...(options?.prompt ? { prompt: options.prompt } : {}),
    }),
  });

  const body = (await res.json()) as {
    success: boolean;
    data?: GenerationResult;
    message?: string;
  };

  if (!res.ok || !body.success || !body.data) {
    throw new Error(body.message ?? "Generation failed");
  }

  return body.data;
}
