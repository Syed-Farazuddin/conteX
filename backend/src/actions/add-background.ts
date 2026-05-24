import type { ActionHandler } from "./types.js";

export const addBackgroundHandler: ActionHandler = async ({
  filename,
  position,
}) => ({
  success: true,
  message: `add-background queued for ${filename} (position: ${JSON.stringify(position ?? {})})`,
});
