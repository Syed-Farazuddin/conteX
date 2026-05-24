import {
  DEFAULT_ACTION_KEY,
  isActionKey,
  runAction,
} from "../actions/index.js";
import type { UploadPayload } from "../types/index.js";

export class UploadService {
  async processUpload(payload: UploadPayload): Promise<{ received: boolean; action: string }> {
    const actionKey = payload.action && isActionKey(payload.action)
      ? payload.action
      : DEFAULT_ACTION_KEY;

    await runAction(actionKey, {
      filename: payload.filename,
      mimetype: payload.mimetype,
      position: payload.position,
      tilt: payload.tilt,
    });

    return { received: true, action: actionKey };
  }
}

export const uploadService = new UploadService();
