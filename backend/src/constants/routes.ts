export type RouteDefinition = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description: string;
};

export const API_ROUTES: RouteDefinition[] = [
  {
    method: "GET",
    path: "/health",
    description: "Health check",
  },
  {
    method: "POST",
    path: "/api/upload",
    description:
      "Receive upload (stub) — body: filename, mimetype, action, position, tilt",
  },
  {
    method: "GET",
    path: "/api/ai/status",
    description: "Check if OPEN_AI_API_KEY is configured",
  },
  {
    method: "POST",
    path: "/api/ai/chat",
    description: "OpenAI chat — body: { prompt } or { messages }",
  },
  {
    method: "POST",
    path: "/api/ai/plan-pipeline",
    description:
      "Vision AI edit plan — body: { imageBase64 }. Generates AI backgrounds for add-background steps.",
  },
  {
    method: "GET",
    path: "/api/replicate/status",
    description: "Check if REPLICATE_API_TOKEN is configured",
  },
  {
    method: "POST",
    path: "/api/replicate/run",
    description:
      "Run any Replicate model — body: { model?, input, timeoutMs? }",
  },
  {
    method: "POST",
    path: "/api/replicate/remove-background",
    description: "Remove background via Replicate — body: { imageUrl }",
  },
  {
    method: "GET",
    path: "/api/clothing/status",
    description: "Clothing cinematic pipeline — config status",
  },
  {
    method: "POST",
    path: "/api/clothing/render",
    description:
      "Clothing shot — body: { imageBase64 | imageUrl, aspectRatio?, prompt? }. Sends image + prompt to Replicate.",
  },
  {
    method: "GET",
    path: "/api/generate/styles",
    description: "List photo generation styles (natural, ghibli, anime, …)",
  },
  {
    method: "POST",
    path: "/api/generate",
    description:
      "Generate styled image — body: { styleId, imageBase64?, aspectRatio?, prompt? }",
  },
  {
    method: "GET",
    path: "/api/generate/asset",
    description:
      "Proxy download generated image — query: ?url=<replicate delivery url>",
  },
];
