export const config = {
  port: Number(process.env.PORT) || 4000,
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  uploadDir: process.env.UPLOAD_DIR ?? "./uploads",
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB) || 10,
  openAiApiKey: process.env.OPEN_AI_API_KEY?.trim() ?? "",
  openAiModel: process.env.OPEN_AI_MODEL ?? "gpt-4o-mini",
  openAiVisionModel: process.env.OPEN_AI_VISION_MODEL ?? "gpt-4o-mini",
  googleApiKey: process.env.GOOGLE_API_KEY?.trim() ?? "",
  googleCseId: process.env.GOOGLE_CSE_ID?.trim() ?? "",
  pexelsApiKey: process.env.PEXELS_API_KEY?.trim() ?? "",
  unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY?.trim() ?? "",
};
