import { addBackgroundHandler } from "./add-background.js";
import { clearBackgroundHandler } from "./clear-background.js";
import { createStubHandler } from "./stub-handler.js";
import { tiltSubjectHandler } from "./tilt-subject.js";
import type { ActionKey, PhotoActionDefinition } from "./types.js";

export type {
  ActionKey,
  ActionHandler,
  ActionPayload,
  PhotoActionDefinition,
  SubjectPosition,
  SubjectTilt,
} from "./types.js";

export const DEFAULT_ACTION_KEY: ActionKey = "clear-background";

export const actionMap: Record<ActionKey, PhotoActionDefinition> = {
  "clear-background": {
    key: "clear-background",
    label: "Clear background",
    description: "Remove the background from the uploaded image",
    handler: clearBackgroundHandler,
  },
  "add-background": {
    key: "add-background",
    label: "Add background",
    description: "Remove background, composite scene, position subject",
    handler: addBackgroundHandler,
  },
  "crop-16-9": {
    key: "crop-16-9",
    label: "Crop 16:9",
    description: "Center crop for landscape video",
    handler: createStubHandler("crop-16-9"),
  },
  "crop-9-16": {
    key: "crop-9-16",
    label: "Crop 9:16",
    description: "Center crop for vertical video",
    handler: createStubHandler("crop-9-16"),
  },
  "crop-1-1": {
    key: "crop-1-1",
    label: "Crop 1:1",
    description: "Center crop square",
    handler: createStubHandler("crop-1-1"),
  },
  "resize-1080p": {
    key: "resize-1080p",
    label: "1080p",
    description: "Resize to 1920x1080",
    handler: createStubHandler("resize-1080p"),
  },
  "resize-vertical": {
    key: "resize-vertical",
    label: "Vertical HD",
    description: "Resize to 1080x1920",
    handler: createStubHandler("resize-vertical"),
  },
  "adjust-enhance": {
    key: "adjust-enhance",
    label: "Enhance",
    description: "Brightness, contrast, saturation",
    handler: createStubHandler("adjust-enhance"),
  },
  "rotate-90": {
    key: "rotate-90",
    label: "Rotate 90°",
    description: "Rotate clockwise",
    handler: createStubHandler("rotate-90"),
  },
  "flip-horizontal": {
    key: "flip-horizontal",
    label: "Flip",
    description: "Mirror horizontally",
    handler: createStubHandler("flip-horizontal"),
  },
  "tilt-subject": {
    key: "tilt-subject",
    label: "Tilt subject",
    description: "Tilt subject left/right with position nudge",
    handler: tiltSubjectHandler,
  },
};

export const actionList = Object.values(actionMap);

export function isActionKey(key: string): key is ActionKey {
  return key in actionMap;
}

export async function runAction(
  key: ActionKey,
  payload: Parameters<PhotoActionDefinition["handler"]>[0],
) {
  const action = actionMap[key];
  if (!action) {
    throw new Error(`Unknown action: ${key}`);
  }
  return action.handler(payload);
}
