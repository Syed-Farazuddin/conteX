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
];
