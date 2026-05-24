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
  | "tilt-subject";

export type SubjectPosition = {
  top: number;
  left: number;
  right: number;
  bottom: number;
};

export type SubjectTilt = {
  degrees: number;
  offsetX: number;
  offsetY: number;
};

export type ActionPayload = {
  filename: string;
  mimetype: string;
  buffer?: Buffer;
  position?: SubjectPosition;
  tilt?: SubjectTilt;
};

export type ActionHandler = (
  payload: ActionPayload,
) => Promise<{ success: boolean; message: string }>;

export type PhotoActionDefinition = {
  key: ActionKey;
  label: string;
  description: string;
  handler: ActionHandler;
};
