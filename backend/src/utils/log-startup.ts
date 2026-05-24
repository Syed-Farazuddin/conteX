import { API_ROUTES } from "../constants/routes.js";
import { actionList } from "../actions/index.js";
import { config } from "../config/index.js";
import { backgroundSearchService } from "../services/background-search.service.js";

const METHOD_WIDTH = 6;

function padMethod(method: string) {
  return method.padEnd(METHOD_WIDTH);
}

export function logStartupBanner() {
  const base = `http://localhost:${config.port}`;
  const aiReady = Boolean(config.openAiApiKey);

  console.log("");
  console.log("┌─────────────────────────────────────────────────────────────");
  console.log("│  ConteX Backend");
  console.log("├─────────────────────────────────────────────────────────────");
  console.log(`│  Server     ${base}`);
  console.log(`│  CORS       ${config.corsOrigin}`);
  console.log(
    `│  OpenAI     ${aiReady ? "configured ✓" : "missing OPEN_AI_API_KEY ✗"}`,
  );
  console.log(
    `│  Model      ${config.openAiModel} (vision: ${config.openAiVisionModel})`,
  );
  const bgProviders = backgroundSearchService.getConfiguredProviders();
  console.log(
    `│  Backgrounds ${bgProviders.length ? bgProviders.join(", ") : "fallback catalog only (add API keys)"}`,
  );
  console.log("├─────────────────────────────────────────────────────────────");
  console.log("│  Endpoints");
  console.log("├─────────────────────────────────────────────────────────────");

  for (const route of API_ROUTES) {
    console.log(
      `│  ${padMethod(route.method)} ${route.path.padEnd(24)} ${route.description}`,
    );
  }

  console.log("├─────────────────────────────────────────────────────────────");
  console.log("│  Registered actions (pipeline / upload)");
  console.log("├─────────────────────────────────────────────────────────────");

  for (const action of actionList) {
    console.log(`│  • ${action.key.padEnd(18)} ${action.label}`);
  }

  console.log("└─────────────────────────────────────────────────────────────");
  console.log("");
}
