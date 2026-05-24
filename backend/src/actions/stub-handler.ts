import type { ActionHandler } from "./types.js";

export function createStubHandler(actionName: string): ActionHandler {
  return async ({ filename }) => ({
    success: true,
    message: `${actionName} queued for ${filename}`,
  });
}
