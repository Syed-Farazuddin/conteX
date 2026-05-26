import { config } from "../config/index.js";
import type {
  ClothingRenderResult,
  ClothingStyleAnalysis,
  ModelGender,
} from "../types/clothing.js";
import { aiService } from "./ai.service.js";
import { replicateService } from "./replicate.service.js";

const STYLE_SYSTEM_PROMPT = `You are a fashion art director for ConteX on-model lookbook photography.
Analyze the clothing item in the image and return ONLY valid JSON (no markdown):
{
  "garmentType": "short label e.g. linen shirt, evening gown, men's blazer",
  "dominantColors": ["2-4 color names"],
  "style": "fashion style e.g. minimalist streetwear, luxury formal",
  "mood": "mood e.g. warm earthy, cool editorial",
  "modelGender": "male or female — pick the gender that best matches how this garment is typically worn and marketed",
  "suggestedBackground": "one vivid sentence: bright, clean environment with strong visibility so the outfit pops (studio, urban, or lifestyle — not dark or busy)"
}`;

const FALLBACK_STYLE: ClothingStyleAnalysis = {
  garmentType: "clothing item",
  dominantColors: ["neutral tones"],
  style: "contemporary fashion",
  mood: "refined and balanced",
  modelGender: "female",
  suggestedBackground:
    "bright modern studio with soft even lighting, clean floor, and uncluttered backdrop so the outfit is fully visible",
};

function parseModelGender(value: unknown): ModelGender {
  if (value === "male" || value === "female") return value;
  return FALLBACK_STYLE.modelGender;
}

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("No JSON object found in model response");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function parseStyleAnalysis(raw: string): ClothingStyleAnalysis {
  const parsed = extractJson(raw) as Record<string, unknown>;
  const colors = Array.isArray(parsed.dominantColors)
    ? parsed.dominantColors.filter((c): c is string => typeof c === "string")
    : FALLBACK_STYLE.dominantColors;

  return {
    garmentType:
      typeof parsed.garmentType === "string"
        ? parsed.garmentType
        : FALLBACK_STYLE.garmentType,
    dominantColors: colors.length ? colors : FALLBACK_STYLE.dominantColors,
    style:
      typeof parsed.style === "string" ? parsed.style : FALLBACK_STYLE.style,
    mood: typeof parsed.mood === "string" ? parsed.mood : FALLBACK_STYLE.mood,
    suggestedBackground:
      typeof parsed.suggestedBackground === "string"
        ? parsed.suggestedBackground
        : FALLBACK_STYLE.suggestedBackground,
    modelGender: parseModelGender(parsed.modelGender),
  };
}

const IMAGEN_ASPECT_RATIOS = ["1:1", "9:16", "16:9", "3:4", "4:3"] as const;

const DEFAULT_CLOTHING_ASPECT_RATIO = "3:4";

function parseAspectRatioValue(ratio: string): number {
  const [w, h] = ratio.split(":").map(Number);
  if (!w || !h) return 1;
  return w / h;
}

/** Imagen 4 only accepts 1:1, 9:16, 16:9, 3:4, 4:3 — map others to the nearest. */
function resolveAspectRatioForModel(model: string, requested: string): string {
  const modelId = model.split(":")[0] ?? model;
  if (!modelId.includes("imagen")) {
    return requested;
  }

  if ((IMAGEN_ASPECT_RATIOS as readonly string[]).includes(requested)) {
    return requested;
  }

  const target = parseAspectRatioValue(requested);
  let best: (typeof IMAGEN_ASPECT_RATIOS)[number] = IMAGEN_ASPECT_RATIOS[0];
  let bestDiff = Infinity;

  for (const candidate of IMAGEN_ASPECT_RATIOS) {
    const diff = Math.abs(parseAspectRatioValue(candidate) - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = candidate;
    }
  }

  return best;
}

/** Map model id to Replicate input schema (see each model's API tab). */
function buildGenerationInput(
  model: string,
  sourceImageUrl: string,
  prompt: string,
  aspectRatio: string,
): Record<string, unknown> {
  const modelId = model.split(":")[0] ?? model;
  const resolvedRatio = resolveAspectRatioForModel(model, aspectRatio);
  const trimmedPrompt = prompt.trim();

  if (!trimmedPrompt) {
    throw new Error("Replicate prompt is empty — cannot run generation");
  }

  if (modelId.includes("imagen")) {
    return {
      prompt: trimmedPrompt,
      aspect_ratio: resolvedRatio,
      image_size: "2K",
      output_format: "png",
      safety_filter_level: "block_medium_and_above",
    };
  }

  return {
    prompt: trimmedPrompt,
    input_image: sourceImageUrl,
    aspect_ratio: resolvedRatio,
    output_format: "png",
    safety_tolerance: 2,
    prompt_upsampling: true,
  };
}

/** Safe copy of Replicate input for API responses (omit huge base64 blobs). */
function summarizeReplicateInput(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const summary = { ...input };
  if (typeof summary.input_image === "string") {
    const img = summary.input_image;
    summary.input_image =
      img.startsWith("data:") || img.length > 200
        ? `[image attached, ${img.length} chars]`
        : img;
  }
  return summary;
}

function isTextOnlyImageModel(model: string): boolean {
  const modelId = model.split(":")[0] ?? model;
  return modelId.includes("imagen");
}

/** Full Imagen / Replicate text prompt — always includes a `prompt` field in the API payload. */
function buildCinematicPrompt(
  style: ClothingStyleAnalysis,
  textOnly: boolean,
): string {
  const palette = style.dominantColors.join(", ");
  const modelLabel =
    style.modelGender === "male" ? "sleek male model" : "sleek female model";

  if (textOnly) {
    return [
      `Professional high-end fashion editorial photograph of a ${modelLabel} wearing the provided outfit: a ${style.garmentType} in ${palette}.`,
      `${style.style} styling, ${style.mood} mood. The model poses naturally (standing or three-quarter); the garment must be fully visible — neckline, sleeves, hem, and fabric texture in sharp focus.`,
      `Background: ${style.suggestedBackground}. Background is bright, clean, and uncluttered with excellent visibility so the dress/outfit stands out clearly against it.`,
      "Even key lighting on the clothing, subtle cinematic depth of field, commercial lookbook quality, photorealistic, no text, no watermark.",
    ].join(" ");
  }

  return [
    `Professional fashion editorial photograph of a ${modelLabel} wearing the exact ${style.garmentType} from the reference image — same colors (${palette}), cut, fabric, and details as the provided clothing.`,
    "The model wears only this garment as the hero piece; fit and drape must match the reference.",
    `${style.style} look, ${style.mood} mood. Full outfit clearly visible with strong separation from the background.`,
    `Background: ${style.suggestedBackground}. Bright, high-visibility backdrop so the clothing is easy to see.`,
    "Editorial lighting, photorealistic, ultra sharp fabric detail, no text, no watermark.",
  ].join(" ");
}

export class ClothingService {
  isConfigured(): boolean {
    return replicateService.isConfigured();
  }

  private async analyzeStyle(
    sourceImageUrl: string,
  ): Promise<ClothingStyleAnalysis> {
    if (!aiService.isConfigured()) {
      return FALLBACK_STYLE;
    }

    const raw = await aiService.analyzeImage(
      sourceImageUrl,
      "Analyze this garment for an on-model fashion shoot: model gender, colors, and a bright visible background.",
      { temperature: 0.3, maxTokens: 400 },
      STYLE_SYSTEM_PROMPT,
    );

    return parseStyleAnalysis(raw);
  }

  private normalizeSourceImage(image: string): string {
    return replicateService.normalizeImageInput(image);
  }

  /**
   * On-model cinematic shot: original photo → OpenAI style → Replicate with
   * `prompt` + `input_image` (flux-kontext) or `prompt` only (imagen).
   */
  async renderCinematic(options: {
    image: string;
    aspectRatio?: string;
    prompt?: string;
  }): Promise<ClothingRenderResult> {
    if (!replicateService.isConfigured()) {
      throw new Error("REPLICATE_API_TOKEN is not configured");
    }

    const sourceImageUrl = this.normalizeSourceImage(options.image);
    const style = await this.analyzeStyle(sourceImageUrl);
    const model = config.replicateClothingModel;
    const cinematicPrompt =
      options.prompt?.trim() ||
      buildCinematicPrompt(style, isTextOnlyImageModel(model));
    const aspectRatio = options.aspectRatio ?? DEFAULT_CLOTHING_ASPECT_RATIO;
    const replicateInput = buildGenerationInput(
      model,
      sourceImageUrl,
      cinematicPrompt,
      aspectRatio,
    );

    const output = await replicateService.run({
      model,
      input: replicateInput,
      timeoutMs: 300_000,
    });

    const outputUrl = replicateService.extractUrl(output);
    if (!outputUrl) {
      throw new Error(
        "Replicate did not return an image URL for the final shot",
      );
    }

    return {
      sourceImageUrl,
      outputUrl,
      style,
      cinematicPrompt,
      replicateInput: summarizeReplicateInput(replicateInput),
      generatedAt: new Date().toISOString(),
    };
  }
}

export const clothingService = new ClothingService();
