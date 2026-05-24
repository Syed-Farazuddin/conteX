import {
  DEFAULT_SUBJECT_POSITION,
  DEFAULT_SUBJECT_TILT,
  type PhotoActionParams,
} from "./types";

export function mergeActionParams(
  defaults?: PhotoActionParams,
  overrides?: PhotoActionParams,
): PhotoActionParams {
  const merged: PhotoActionParams = {
    ...defaults,
    ...overrides,
  };

  if (defaults?.position || overrides?.position) {
    merged.position = {
      ...DEFAULT_SUBJECT_POSITION,
      ...defaults?.position,
      ...overrides?.position,
    };
  }

  if (defaults?.tilt || overrides?.tilt) {
    merged.tilt = {
      ...DEFAULT_SUBJECT_TILT,
      ...defaults?.tilt,
      ...overrides?.tilt,
    };
  }

  return merged;
}
