import type { ActionKey } from "../actions/types.js";

export interface UploadPayload {
  filename: string;
  mimetype: string;
  size: number;
  action?: ActionKey;
  position?: import("../actions/types.js").SubjectPosition;
  tilt?: import("../actions/types.js").SubjectTilt;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}
