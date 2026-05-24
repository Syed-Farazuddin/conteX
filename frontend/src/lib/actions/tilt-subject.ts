import { configureHighQualityCanvas } from "./canvas-utils";
import { clearBackground } from "./clear-background";
import { canvasToBlobUrl, loadImage } from "./load-image";
import { getOpaqueBounds } from "./subject-bounds";
import {
  DEFAULT_SUBJECT_TILT,
  type PhotoActionFn,
  type SubjectTilt,
} from "./types";

function resolveTilt(tilt?: Partial<SubjectTilt>): SubjectTilt {
  return {
    degrees: tilt?.degrees ?? DEFAULT_SUBJECT_TILT.degrees,
    offsetX: tilt?.offsetX ?? DEFAULT_SUBJECT_TILT.offsetX,
    offsetY: tilt?.offsetY ?? DEFAULT_SUBJECT_TILT.offsetY,
  };
}

/**
 * Isolates the subject, removes them from the original scene, then redraws
 * at a slight tilt (left/right) with optional position nudge.
 */
export const tiltSubject: PhotoActionFn = async (sourceUrl, params) => {
  const { degrees, offsetX, offsetY } = resolveTilt(params?.tilt);
  const cutoutUrl = await clearBackground(sourceUrl);

  try {
    const [original, subject] = await Promise.all([
      loadImage(sourceUrl),
      loadImage(cutoutUrl),
    ]);

    const width = original.naturalWidth;
    const height = original.naturalHeight;
    const bounds = getOpaqueBounds(subject);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    configureHighQualityCanvas(ctx);

    ctx.drawImage(original, 0, 0, width, height);

    ctx.globalCompositeOperation = "destination-out";
    ctx.drawImage(subject, 0, 0, width, height);

    ctx.globalCompositeOperation = "source-over";
    ctx.save();
    ctx.translate(bounds.centerX + offsetX, bounds.centerY + offsetY);
    ctx.rotate((degrees * Math.PI) / 180);
    ctx.drawImage(subject, -bounds.centerX, -bounds.centerY, width, height);
    ctx.restore();

    return await canvasToBlobUrl(canvas, "image/png");
  } finally {
    URL.revokeObjectURL(cutoutUrl);
  }
};
