import type { ActionKey } from "../actions/types.js";

export type PipelineStepParams = {
  position?: {
    top?: number;
    left?: number;
    right?: number;
    bottom?: number;
    verticalAlign?: "top" | "center" | "bottom";
    horizontalAlign?: "left" | "center" | "right";
  };
  tilt?: { degrees?: number; offsetX?: number; offsetY?: number };
  brightness?: number;
  contrast?: number;
  saturation?: number;
  /** AI-written scene brief — shown in UI; used to build stock search terms */
  backgroundScene?: string;
  /** Short keywords for Google / Pexels / Unsplash search */
  backgroundSearchQuery?: string;
  backgroundOrientation?: "landscape" | "portrait" | "square";
  /** Stock photo URL — set by backend before response */
  backgroundUrl?: string;
  /** Where the background URL came from (google, pexels, unsplash, loremflickr, fallback) */
  backgroundSource?: string;
};

export type PipelineStep = {
  action: ActionKey;
  params?: PipelineStepParams;
  reason?: string;
};

export type PipelinePlan = {
  summary: string;
  actions: PipelineStep[];
};

export type PipelinePlanSource = "openai" | "mock";

export type PipelinePlanResult = {
  plan: PipelinePlan;
  source: PipelinePlanSource;
  planId: string;
};
