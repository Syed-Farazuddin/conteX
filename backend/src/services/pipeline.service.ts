import { randomUUID } from "node:crypto";
import { AI_ACTION_CATALOG } from "../constants/action-catalog.js";
import { isActionKey } from "../actions/index.js";
import { config } from "../config/index.js";
import { aiService } from "./ai.service.js";
import { backgroundSearchService } from "./background-search.service.js";
import type {
  PipelinePlan,
  PipelinePlanResult,
  PipelineStep,
} from "../types/pipeline.js";

/** Set USE_MOCK_PIPELINE=true in backend/.env to skip OpenAI (dev only). */
function isMockPipelineEnabled() {
  return config.useMockPipeline;
}

const MOCK_PIPELINE_PLAN: PipelinePlan = {
  summary:
    "Enhance the image and add a suitable background for a cleaner product-style shot.",
  actions: [
    {
      action: "adjust-enhance",
      reason:
        "Boosts brightness and contrast to make the subject stand out against the background.",
      params: {
        brightness: 1.08,
        contrast: 1.12,
        saturation: 1.05,
      },
    },
    {
      action: "add-background",
      reason:
        "Places the subject in a more visually appealing context that enhances the overall aesthetic.. The subject is placed centrally to avoid obstructions and ensure a natural grounding on the visible surface.",
      params: {
        position: {
          top: 30,
          left: 15,
          right: 15,
          bottom: 2,
          verticalAlign: "bottom",
          horizontalAlign: "center",
        },
        backgroundScene: "A serene outdoor evening setting with soft lighting.",
        backgroundSearchQuery: "outdoor evening open space serene",
        backgroundOrientation: "portrait",
        backgroundUrl:
          "https://images.unsplash.com/photo-1501785888041-af93ef12fa88?fm=jpg&q=90&w=2400&auto=format&fit=crop",
        backgroundSource: "fallback",
      },
    },
    {
      action: "crop-9-16",
      reason:
        "Optimizes the image for vertical formats suitable for social media platforms.",
      params: {},
    },
  ],
};

const SYSTEM_PROMPT = `You are a professional photo and video editor AI for ConteX.
Analyze the uploaded image and return a JSON plan to make it more beautiful, meaningful, and appropriate for social/video use.

RULES:
- Return ONLY valid JSON, no markdown fences.
- Use ONLY actions from the catalog below.
- Return 2–6 actions in logical execution order.
- Order: color/light fixes → background (add-background OR clear-background, not both) → crop → resize export.
- Prefer "add-background" over "clear-background" for portraits when a scene would help.
- End with crop or resize matching the content (portrait → crop-9-16 or resize-vertical, landscape → crop-16-9 or resize-1080p).
- Include optional params when helpful (tilt degrees, position insets, enhance values).
- Skip rotate-90 unless orientation is clearly wrong.

ADJUST-ENHANCE (REQUIRED params when used):
- ALWAYS include brightness, contrast, and saturation as decimal multipliers (1.0 = no change).
- Analyze the image: dark/underexposed → brightness 1.1-1.2; already bright → 1.0-1.05.
- Flat/low punch → contrast 1.08-1.18; harsh → 1.0-1.05.
- Dull colors → saturation 1.05-1.15; already vivid → 1.0-1.05.
- Logos on dark backgrounds: moderate brightness 1.05-1.12, contrast 1.1-1.2, saturation 1.0-1.08.

ADD-BACKGROUND POSITIONING (REQUIRED when using add-background):
- top / left / right: % insets from frame edges (max height band and horizontal placement).
- bottom (with verticalAlign "bottom"): tiny margin below the subject's feet — 0 = flush to frame bottom, 2-4 = small breathing room. NOT a large value.
- ALWAYS include verticalAlign and horizontalAlign.
- FULL-BODY people: verticalAlign "bottom", bottom 0-3, top 28-42, left/right 10-25 toward open space.
- WAIST-UP / headshot: verticalAlign "bottom", bottom 0-2, top 18-30 (higher top = smaller subject, more headroom).
- LOGOS / flat graphics: verticalAlign "center", horizontalAlign "center", symmetric insets 12-20.
- NEVER use equal insets on all sides for standing people — that causes floating mid-frame.
- Pick backgroundSearchQuery scenes with open foreground / negative space, not busy center objects.
- If original background has a person, assume full-body or waist-up from visible framing.

CATALOG:
${JSON.stringify(AI_ACTION_CATALOG, null, 2)}

JSON SCHEMA:
{
  "summary": "One sentence explaining the overall edit strategy",
  "actions": [
    {
      "action": "<catalog key>",
      "params": { optional params matching catalog },
      "reason": "Why this step helps"
    }
  ]
}`;

const PLACEMENT_SYSTEM_PROMPT = `You are a compositing expert for ConteX.
Image 1 = subject photo to cut out and place on Image 2 = the chosen background.

Return ONLY valid JSON:
{
  "position": {
    "top": number 0-45,
    "left": number 0-45,
    "right": number 0-45,
    "bottom": number 0-45,
    "verticalAlign": "bottom" | "center",
    "horizontalAlign": "left" | "center" | "right"
  },
  "placementReason": "One sentence explaining placement"
}

CRITICAL RULES:
1. GROUNDING: verticalAlign "bottom" with bottom 0-3 so feet/base sit on the frame bottom — never floating. Large bottom values create a visible gap.
2. AVOID OBSTRUCTIONS: Do NOT place the subject on statues, sculptures, furniture, signs, or central focal objects. Shift horizontalAlign left or right toward empty pavement, grass, or sky.
3. FULL-BODY: top 28-42, bottom 0-3, left/right 10-28 — tighter on the cluttered side, wider on open space.
4. WAIST-UP: top 18-30, bottom 0-2, verticalAlign bottom.
5. SCALE: Smaller left+right insets = larger subject. Subject should feel naturally sized for the scene.
6. HORIZON: Align the subject's base with visible ground plane, sidewalk, or floor in the background.`;

const DEFAULT_PORTRAIT_POSITION = {
  top: 32,
  left: 12,
  right: 12,
  bottom: 2,
  verticalAlign: "bottom" as const,
  horizontalAlign: "center" as const,
};

const DEFAULT_ENHANCE = {
  brightness: 1.06,
  contrast: 1.12,
  saturation: 1.1,
};

function normalizePipelineActions(actions: PipelineStep[]): PipelineStep[] {
  const hasAddBackground = actions.some((s) => s.action === "add-background");
  if (!hasAddBackground) return actions;
  return actions.filter((step) => step.action !== "tilt-subject");
}

function sanitizeEnhanceParams(raw: Record<string, unknown>) {
  return {
    brightness: clamp(
      Number(raw.brightness) || DEFAULT_ENHANCE.brightness,
      0.85,
      1.25,
    ),
    contrast: clamp(
      Number(raw.contrast) || DEFAULT_ENHANCE.contrast,
      0.85,
      1.35,
    ),
    saturation: clamp(
      Number(raw.saturation) || DEFAULT_ENHANCE.saturation,
      0.8,
      1.3,
    ),
  };
}

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI response did not contain JSON");
    return JSON.parse(match[0]);
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function parseAlign<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === "string" &&
    (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function sanitizePosition(raw: Record<string, unknown>) {
  return {
    top: clamp(Number(raw.top) || DEFAULT_PORTRAIT_POSITION.top, 0, 45),
    left: clamp(Number(raw.left) || DEFAULT_PORTRAIT_POSITION.left, 0, 45),
    right: clamp(Number(raw.right) || DEFAULT_PORTRAIT_POSITION.right, 0, 45),
    bottom: clamp(
      Number(raw.bottom) || DEFAULT_PORTRAIT_POSITION.bottom,
      0,
      45,
    ),
    verticalAlign: parseAlign(
      raw.verticalAlign,
      ["top", "center", "bottom"] as const,
      DEFAULT_PORTRAIT_POSITION.verticalAlign,
    ),
    horizontalAlign: parseAlign(
      raw.horizontalAlign,
      ["left", "center", "right"] as const,
      DEFAULT_PORTRAIT_POSITION.horizontalAlign,
    ),
  };
}

function sanitizeStep(raw: unknown): PipelineStep | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const action = item.action;
  if (typeof action !== "string" || !isActionKey(action)) return null;

  const step: PipelineStep = { action };
  if (typeof item.reason === "string") step.reason = item.reason;

  const params = item.params;
  if (params && typeof params === "object") {
    const p = params as Record<string, unknown>;
    step.params = {};

    if (p.position && typeof p.position === "object") {
      step.params.position = sanitizePosition(
        p.position as Record<string, unknown>,
      );
    }

    if (p.tilt && typeof p.tilt === "object") {
      const t = p.tilt as Record<string, unknown>;
      step.params.tilt = {
        degrees: clamp(Number(t.degrees) || 0, -6, 6),
        offsetX: clamp(Number(t.offsetX) || 0, -30, 30),
        offsetY: clamp(Number(t.offsetY) || 0, -30, 30),
      };
    }

    const hasEnhance =
      p.brightness != null || p.contrast != null || p.saturation != null;
    if (hasEnhance || step.action === "adjust-enhance") {
      step.params = {
        ...step.params,
        ...sanitizeEnhanceParams(p),
      };
    }

    if (typeof p.backgroundScene === "string" && p.backgroundScene.trim()) {
      step.params.backgroundScene = p.backgroundScene.trim();
    }
    if (
      typeof p.backgroundSearchQuery === "string" &&
      p.backgroundSearchQuery.trim()
    ) {
      step.params.backgroundSearchQuery = p.backgroundSearchQuery.trim();
    }
    if (
      typeof p.backgroundUrl === "string" &&
      p.backgroundUrl.startsWith("http")
    ) {
      step.params.backgroundUrl = p.backgroundUrl.trim();
    }
    if (
      p.backgroundOrientation === "landscape" ||
      p.backgroundOrientation === "portrait" ||
      p.backgroundOrientation === "square"
    ) {
      step.params.backgroundOrientation = p.backgroundOrientation;
    }
  }

  return step;
}

function fallbackPlan(): PipelinePlan {
  return {
    summary:
      "Default enhancement: polish colors, add a scene, and frame for vertical video.",
    actions: [
      {
        action: "adjust-enhance",
        reason: "Improve overall tone and clarity",
        params: DEFAULT_ENHANCE,
      },
      {
        action: "add-background",
        params: {
          position: {
            ...DEFAULT_PORTRAIT_POSITION,
            top: 34,
            left: 18,
            right: 10,
            horizontalAlign: "left" as const,
          },
          backgroundScene:
            "Soft golden-hour city rooftop with warm bokeh lights, empty space for a portrait subject",
          backgroundSearchQuery: "city rooftop golden hour bokeh",
          backgroundOrientation: "portrait",
        },
        reason: "Place subject on a beautiful background",
      },
      { action: "crop-9-16", reason: "Frame for vertical social video" },
    ],
  };
}

async function enrichBackgroundSteps(
  actions: PipelineStep[],
): Promise<PipelineStep[]> {
  return Promise.all(
    actions.map(async (step) => {
      if (step.action !== "add-background" || step.params?.backgroundUrl) {
        return step;
      }

      const scene =
        step.params?.backgroundScene?.trim() ||
        "Professional soft-focus studio background with natural lighting";
      const orientation = step.params?.backgroundOrientation ?? "landscape";
      const searchQuery = step.params?.backgroundSearchQuery;

      const backgroundUrl = await backgroundSearchService.findBackgroundUrl(
        scene,
        orientation,
        searchQuery,
      );

      return {
        ...step,
        params: {
          ...step.params,
          backgroundUrl: backgroundUrl.url,
          backgroundSource: backgroundUrl.source,
          backgroundScene: scene,
        },
      };
    }),
  );
}

async function refineBackgroundPlacement(
  subjectDataUrl: string,
  actions: PipelineStep[],
): Promise<PipelineStep[]> {
  return Promise.all(
    actions.map(async (step) => {
      if (step.action !== "add-background" || !step.params?.backgroundUrl) {
        return step;
      }

      try {
        const raw = await aiService.analyzeImages(
          [subjectDataUrl, step.params.backgroundUrl],
          "Compute optimal composite placement for Image 1 (subject) on Image 2 (background). Return JSON only.",
          { temperature: 0.2, maxTokens: 400 },
          PLACEMENT_SYSTEM_PROMPT,
        );

        const parsed = extractJson(raw) as {
          position?: Record<string, unknown>;
          placementReason?: string;
        };

        if (parsed.position && typeof parsed.position === "object") {
          const position = sanitizePosition(parsed.position);
          const placementNote =
            typeof parsed.placementReason === "string"
              ? parsed.placementReason.trim()
              : "";

          return {
            ...step,
            params: { ...step.params, position },
            reason: placementNote
              ? `${step.reason ?? "Add background"}. ${placementNote}`
              : step.reason,
          };
        }
      } catch {
        /* keep plan position or defaults below */
      }

      if (!step.params.position) {
        return {
          ...step,
          params: { ...step.params, position: DEFAULT_PORTRAIT_POSITION },
        };
      }

      return step;
    }),
  );
}

export class PipelineService {
  async planFromImageBase64(_imageBase64: string): Promise<PipelinePlanResult> {
    // if (isMockPipelineEnabled()) {
    //   console.log("[pipeline] returning mock plan (USE_MOCK_PIPELINE=true)");
    //   return {
    //     source: "mock",
    //     planId: "mock-static",
    //     plan: {
    //       ...MOCK_PIPELINE_PLAN,
    //       actions: normalizePipelineActions(MOCK_PIPELINE_PLAN.actions),
    //     },
    //   };
    // }

    const planId = randomUUID();
    console.log(`[pipeline] planning via OpenAI vision… planId=${planId}`);

    if (!aiService.isConfigured()) {
      throw new Error("OPEN_AI_API_KEY is not configured");
    }

    const dataUrl = _imageBase64.startsWith("data:")
      ? _imageBase64
      : `data:image/jpeg;base64,${_imageBase64}`;

    // Live OpenAI planning — only runs when USE_MOCK_PIPELINE is false
    const raw = await aiService.analyzeImage(
      dataUrl,
      "Analyze this image and return the JSON edit plan.",
      { temperature: 0.3, maxTokens: 1500 },
      SYSTEM_PROMPT,
    );

    const parsed = extractJson(raw) as Record<string, unknown>;
    const summary =
      typeof parsed.summary === "string"
        ? parsed.summary
        : "AI recommended edit pipeline";

    const rawActions = Array.isArray(parsed.actions) ? parsed.actions : [];
    let actions = rawActions
      .map(sanitizeStep)
      .filter((s): s is PipelineStep => s !== null)
      .slice(0, 8);

    actions = actions.filter(
      (step) =>
        step.action !== "tilt-subject" ||
        Math.abs(step.params?.tilt?.degrees ?? 0) >= 0.5,
    );

    if (actions.length === 0) {
      const fallback = fallbackPlan();
      const withBackgrounds = await enrichBackgroundSteps(fallback.actions);
      const plan = {
        ...fallback,
        actions: normalizePipelineActions(
          await refineBackgroundPlacement(dataUrl, withBackgrounds),
        ),
      };
      console.log(`[pipeline] OpenAI plan complete planId=${planId}`);
      return { source: "openai", planId, plan };
    }

    const withBackgrounds = await enrichBackgroundSteps(actions);
    const placedActions = await refineBackgroundPlacement(
      dataUrl,
      withBackgrounds,
    );
    const plan = {
      summary,
      actions: normalizePipelineActions(placedActions),
    };
    console.log(`[pipeline] OpenAI plan complete planId=${planId}`);
    return { source: "openai", planId, plan };
  }
}

export const pipelineService = new PipelineService();
