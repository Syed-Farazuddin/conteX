import { config } from "../config/index.js";
import {
  GENERATION_STYLES,
  getGenerationStyle,
  type GenerationStyleId,
} from "../constants/generation-styles.js";
import { fetchImageAsDataUrl } from "../utils/fetch-image-base64.js";
import { clothingService } from "./clothing.service.js";
import { replicateService } from "./replicate.service.js";

const IMAGEN_ASPECT_RATIOS = ["1:1", "9:16", "16:9", "3:4", "4:3"] as const;

const FLUX_EXTRA_RATIOS = [
  "4:5",
  "5:4",
  "2:3",
  "3:2",
  "21:9",
  "9:21",
  "2:1",
  "1:2",
];

function parseAspectRatioValue(ratio: string): number {
  const [w, h] = ratio.split(":").map(Number);
  if (!w || !h) return 1;
  return w / h;
}

function resolveAspectRatioForModel(model: string, requested: string): string {
  const modelId = model.split(":")[0] ?? model;

  if (modelId.includes("flux")) {
    const allowed = [
      "match_input_image",
      ...IMAGEN_ASPECT_RATIOS,
      ...FLUX_EXTRA_RATIOS,
    ];
    if (allowed.includes(requested)) return requested;
  }

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

function buildImageGenerationInput(
  model: string,
  sourceImageUrl: string,
  prompt: string,
  aspectRatio: string,
): Record<string, unknown> {
  const modelId = model.split(":")[0] ?? model;
  const resolvedRatio = resolveAspectRatioForModel(model, aspectRatio);
  const trimmedPrompt = prompt.trim();
  if (!trimmedPrompt) {
    throw new Error("Generation prompt is empty");
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

export type GenerationResult = {
  styleId: GenerationStyleId;
  styleLabel: string;
  sourceImageUrl: string;
  outputUrl: string;
  /** Embedded image for reliable mobile gallery save (optional if fetch fails). */
  outputBase64?: string;
  prompt: string;
  replicateInput: Record<string, unknown>;
  generatedAt: string;
};

async function withEmbeddedOutput(
  result: Omit<GenerationResult, "outputBase64">,
): Promise<GenerationResult> {
  const outputBase64 = await fetchImageAsDataUrl(result.outputUrl);
  return outputBase64 ? { ...result, outputBase64 } : result;
}

export class GenerationService {
  listStyles() {
    return GENERATION_STYLES.map(({ promptTemplate: _p, ...rest }) => rest);
  }

  isConfigured(): boolean {
    return replicateService.isConfigured();
  }

  async generate(options: {
    styleId: string;
    image: string;
    prompt?: string;
    aspectRatio?: string;
  }): Promise<GenerationResult> {
    const style = getGenerationStyle(options.styleId);
    if (!style) {
      throw new Error(`Unknown generation style: ${options.styleId}`);
    }

    if (!replicateService.isConfigured()) {
      throw new Error("REPLICATE_API_TOKEN is not configured");
    }

    const sourceImageUrl = replicateService.normalizeImageInput(options.image);
    const aspectRatio = options.aspectRatio ?? style.aspectRatio;

    if (style.pipeline === "clothing") {
      const result = await clothingService.renderCinematic({
        image: options.image,
        aspectRatio,
        prompt: options.prompt,
      });

      return withEmbeddedOutput({
        styleId: style.id,
        styleLabel: style.label,
        sourceImageUrl: result.sourceImageUrl,
        outputUrl: result.outputUrl,
        prompt: result.cinematicPrompt,
        replicateInput: result.replicateInput,
        generatedAt: result.generatedAt,
      });
    }

    const prompt = options.prompt?.trim() || style.promptTemplate;
    const model = config.replicateGenerationModel;
    const replicateInput = buildImageGenerationInput(
      model,
      sourceImageUrl,
      prompt,
      aspectRatio,
    );

    const output = await replicateService.run({
      model,
      input: replicateInput,
      timeoutMs: 300_000,
    });

    const outputUrl = replicateService.extractUrl(output);
    if (!outputUrl) {
      throw new Error("Replicate did not return an image URL");
    }

    return withEmbeddedOutput({
      styleId: style.id,
      styleLabel: style.label,
      sourceImageUrl,
      outputUrl,
      prompt,
      replicateInput: summarizeReplicateInput(replicateInput),
      generatedAt: new Date().toISOString(),
    });
  }
}

export const generationService = new GenerationService();
