import type { UploadPayload } from "../types/index.js";

export class UploadService {
  async processUpload(_payload: UploadPayload): Promise<{ received: boolean }> {
    // TODO: persist file, validate, scan, etc.
    return { received: true };
  }
}

export const uploadService = new UploadService();
