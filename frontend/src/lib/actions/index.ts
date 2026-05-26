import { backgroundAdder } from "./add-background";
import { clearBackground } from "./clear-background";
import { tiltSubject } from "./tilt-subject";
import {
  adjustEnhance,
  createCropAction,
  createResizeAction,
  flipHorizontal,
  rotate90,
} from "./image-process";
import { mergeActionParams } from "./merge-params";
import type { ActionKey, PhotoAction, PhotoActionParams } from "./types";

export type {
  ActionKey,
  AspectRatioKey,
  PhotoAction,
  PhotoActionFn,
  PhotoActionParams,
  ResizePresetKey,
  SubjectPosition,
  SubjectTilt,
} from "./types";

export { DEFAULT_SUBJECT_POSITION, DEFAULT_SUBJECT_TILT } from "./types";

/** @deprecated Legacy tools — use GenerationStudio when ENABLE_LEGACY_TOOLS is false */
export const DEFAULT_ACTION_KEY: ActionKey = "ai-auto-edit";

export const actionMap: Record<ActionKey, PhotoAction> = {
  "clear-background": {
    key: "clear-background",
    label: "Clear BG",
    description: "Remove the background and keep the subject",
    scanningLabel: "REMOVING BACKGROUND",
    category: "segmentation",
    run: clearBackground,
  },
  "add-background": {
    key: "add-background",
    label: "Add BG",
    description:
      "Remove background, add a random scene, position subject with insets",
    scanningLabel: "ADDING BACKGROUND",
    category: "composite",
    defaultParams: {
      position: { top: 8, left: 8, right: 8, bottom: 12 },
    },
    run: backgroundAdder,
  },
  "crop-16-9": {
    key: "crop-16-9",
    label: "Crop 16:9",
    description: "Center crop for landscape video (YouTube, TV)",
    scanningLabel: "CROPPING 16:9",
    category: "frame",
    defaultParams: { aspectRatio: "16:9" },
    run: createCropAction("16:9"),
  },
  "crop-9-16": {
    key: "crop-9-16",
    label: "Crop 9:16",
    description: "Center crop for vertical video (Reels, TikTok, Shorts)",
    scanningLabel: "CROPPING 9:16",
    category: "frame",
    defaultParams: { aspectRatio: "9:16" },
    run: createCropAction("9:16"),
  },
  "crop-1-1": {
    key: "crop-1-1",
    label: "Crop 1:1",
    description: "Center crop square — social posts and thumbnails",
    scanningLabel: "CROPPING 1:1",
    category: "frame",
    defaultParams: { aspectRatio: "1:1" },
    run: createCropAction("1:1"),
  },
  "resize-1080p": {
    key: "resize-1080p",
    label: "1080p",
    description: "Scale and crop to 1920×1080 (HD landscape)",
    scanningLabel: "RESIZING 1080P",
    category: "frame",
    defaultParams: { resizePreset: "1080p" },
    run: createResizeAction("1080p"),
  },
  "resize-vertical": {
    key: "resize-vertical",
    label: "Vertical HD",
    description: "Scale and crop to 1080×1920 (vertical video)",
    scanningLabel: "RESIZING VERTICAL",
    category: "frame",
    defaultParams: { resizePreset: "vertical" },
    run: createResizeAction("vertical"),
  },
  "adjust-enhance": {
    key: "adjust-enhance",
    label: "Enhance",
    description: "Boost brightness, contrast, and saturation",
    scanningLabel: "ENHANCING",
    category: "color",
    defaultParams: {
      brightness: 1.06,
      contrast: 1.12,
      saturation: 1.1,
    },
    run: adjustEnhance,
  },
  "rotate-90": {
    key: "rotate-90",
    label: "Rotate 90°",
    description: "Rotate clockwise — fix phone orientation",
    scanningLabel: "ROTATING",
    category: "transform",
    defaultParams: { rotation: 90 },
    run: rotate90,
  },
  "flip-horizontal": {
    key: "flip-horizontal",
    label: "Flip",
    description: "Mirror horizontally",
    scanningLabel: "FLIPPING",
    category: "transform",
    defaultParams: { flip: "horizontal" },
    run: flipHorizontal,
  },
  "tilt-subject": {
    key: "tilt-subject",
    label: "Tilt subject",
    description:
      "Tilt your body slightly left or right and nudge position — background stays put",
    scanningLabel: "TILTING SUBJECT",
    category: "transform",
    defaultParams: {
      tilt: { degrees: 0, offsetX: 0, offsetY: 0 },
    },
    run: tiltSubject,
  },
  "ai-auto-edit": {
    key: "ai-auto-edit",
    label: "AI Auto Edit",
    description:
      "AI analyzes your photo and runs the best actions automatically",
    scanningLabel: "AI ANALYZING",
    category: "ai",
    run: async () => {
      throw new Error("AI Auto Edit uses the pipeline runner");
    },
  },
  "clothing-cinematic": {
    key: "clothing-cinematic",
    label: "Clothing shot",
    description:
      "Send your photo with an AI prompt to generate an on-model cinematic shot",
    scanningLabel: "CLOTHING CINEMATIC",
    category: "ai",
    run: async () => {
      throw new Error("Clothing shot uses the backend Replicate service");
    },
  },
};

export { tiltSubject } from "./tilt-subject";

export { backgroundAdder } from "./add-background";
export { clearBackground } from "./clear-background";
export { mergeActionParams } from "./merge-params";
export {
  planAiPipeline,
  runPhotoActionPipeline,
  type PipelinePlan,
  type PipelineProgress,
  type PipelineStep,
} from "./pipeline";

export const actionList = Object.values(actionMap);

export function isActionKey(key: string): key is ActionKey {
  return key in actionMap;
}

export async function runPhotoAction(
  key: ActionKey,
  sourceUrl: string,
  params?: PhotoActionParams,
): Promise<string> {
  const action = actionMap[key];
  if (!action) {
    throw new Error(`Unknown action: ${key}`);
  }
  const merged = mergeActionParams(action.defaultParams, params);
  return action.run(sourceUrl, merged);
}
