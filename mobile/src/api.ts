const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

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
  const res = await fetch(`${API_BASE}/api/generate/styles`);
  const body = (await res.json()) as {
    configured?: boolean;
    styles?: GenerationStyle[];
  };
  return {
    configured: Boolean(body.configured),
    styles: body.styles ?? [],
  };
}

export async function generateImage(
  base64: string,
  styleId: string,
  prompt?: string,
): Promise<GenerationResult> {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      styleId,
      imageBase64: base64.startsWith("data:")
        ? base64
        : `data:image/jpeg;base64,${base64}`,
      ...(prompt?.trim() ? { prompt: prompt.trim() } : {}),
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
