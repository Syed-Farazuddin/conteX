/** Insets from canvas edges as percentages (0–100). Defines the placement box for the subject. */
export type SubjectPosition = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  /** Where the subject sits inside the inset box. Default: bottom for people. */
  verticalAlign?: "top" | "center" | "bottom";
  horizontalAlign?: "left" | "center" | "right";
};

export const DEFAULT_SUBJECT_POSITION: SubjectPosition = {
  top: 32,
  left: 12,
  right: 12,
  bottom: 2,
  verticalAlign: "bottom",
  horizontalAlign: "center",
};

/** Slight subject tilt and nudge (degrees: negative = left, positive = right). */
export type SubjectTilt = {
  degrees: number;
  offsetX: number;
  offsetY: number;
};

export const DEFAULT_SUBJECT_TILT: SubjectTilt = {
  degrees: 0,
  offsetX: 0,
  offsetY: 0,
};

export type AspectRatioKey = "16:9" | "9:16" | "1:1" | "4:5";

export type ResizePresetKey = "1080p" | "vertical" | "square";

export type PhotoActionParams = {
  /** Subject placement for add-background (and similar composites). */
  position?: SubjectPosition;
  /** Subject tilt for tilt-subject (degrees + pixel offset). */
  tilt?: SubjectTilt;
  aspectRatio?: AspectRatioKey;
  resizePreset?: ResizePresetKey;
  rotation?: number;
  flip?: "horizontal" | "vertical";
  brightness?: number;
  contrast?: number;
  saturation?: number;
  /** Background image URL from AI pipeline (OpenAI or other HTTPS source). */
  backgroundUrl?: string;
  backgroundScene?: string;
  backgroundSource?: string;
  backgroundOrientation?: "landscape" | "portrait" | "square";
};

/** Result URL is always a blob: URL — caller must revoke when done. */
export type PhotoActionFn = (
  sourceUrl: string,
  params?: PhotoActionParams,
) => Promise<string>;

export type ActionKey =
  | "clear-background"
  | "add-background"
  | "crop-16-9"
  | "crop-9-16"
  | "crop-1-1"
  | "resize-1080p"
  | "resize-vertical"
  | "adjust-enhance"
  | "rotate-90"
  | "flip-horizontal"
  | "tilt-subject"
  | "ai-auto-edit";

export type PhotoAction = {
  key: ActionKey;
  label: string;
  description: string;
  scanningLabel: string;
  category:
    | "segmentation"
    | "composite"
    | "frame"
    | "color"
    | "transform"
    | "ai";
  defaultParams?: PhotoActionParams;
  run: PhotoActionFn;
};
