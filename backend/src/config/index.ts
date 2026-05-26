import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const configDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({
  path: resolve(configDir, "../../.env"),
  override: true,
});

export const config = {
  port: Number(process.env.PORT) || 4000,
  uploadDir: process.env.UPLOAD_DIR ?? "./uploads",
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB) || 10,
  openAiApiKey: process.env.OPEN_AI_API_KEY?.trim() ?? "",
  openAiModel: process.env.OPEN_AI_MODEL ?? "gpt-4o-mini",
  openAiVisionModel: process.env.OPEN_AI_VISION_MODEL ?? "gpt-4o-mini",
  googleApiKey: process.env.GOOGLE_API_KEY?.trim() ?? "",
  googleCseId: process.env.GOOGLE_CSE_ID?.trim() ?? "",
  pexelsApiKey: process.env.PEXELS_API_KEY?.trim() ?? "",
  unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY?.trim() ?? "",
  /** When true, plan-pipeline returns MOCK_PIPELINE_PLAN (no OpenAI calls). */
  useMockPipeline: process.env.USE_MOCK_PIPELINE === "true",
  replicateApiToken: process.env.REPLICATE_API_TOKEN?.trim() ?? "",
  replicateDefaultModel:
    process.env.REPLICATE_DEFAULT_MODEL?.trim() ??
    "google/imagen-4:19335492dbe879d4b5983bff2149f597db8314ccc7fe374e6313af7c2b52792f",
  /** Pinned version IDs avoid 404 on /models/{owner}/{name}/predictions. */
  replicateBgModel:
    process.env.REPLICATE_BG_MODEL?.trim() ??
    "851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc",
  /** Final shot — flux-kontext-pro accepts `prompt` + `input_image` (original photo). */
  replicateClothingModel:
    process.env.REPLICATE_CLOTHING_MODEL?.trim() ??
    "black-forest-labs/flux-kontext-pro:03ada98f518905f4c7df5150c361338a683845249550af5ed21dc449be56d500",
  replicateGenerationModel:
    process.env.REPLICATE_GENERATION_MODEL?.trim() ??
    process.env.REPLICATE_CLOTHING_MODEL?.trim() ??
    "black-forest-labs/flux-kontext-pro:03ada98f518905f4c7df5150c361338a683845249550af5ed21dc449be56d500",
  /** Comma-separated origins for web + Expo (e.g. http://localhost:3000,http://localhost:8081) */
  corsOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
};
