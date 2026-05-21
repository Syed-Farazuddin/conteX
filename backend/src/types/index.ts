export interface UploadPayload {
  filename: string;
  mimetype: string;
  size: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}
