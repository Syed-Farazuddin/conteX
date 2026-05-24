import type { ActionHandler } from "./types.js";

export const tiltSubjectHandler: ActionHandler = async ({ filename, tilt }) => ({
  success: true,
  message: `tilt-subject queued for ${filename} (tilt: ${JSON.stringify(tilt ?? {})})`,
});
