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
 * the cropped silhouette at a slight tilt. Uses an expanded erase mask so
 * rotated pixels don't leave dark transparent gaps.
 */
export const tiltSubject: PhotoActionFn = async (sourceUrl, params) => {
  const { degrees, offsetX, offsetY } = resolveTilt(params?.tilt);
  if (Math.abs(degrees) < 0.4) return sourceUrl;

  const cutoutUrl = await clearBackground(sourceUrl);

  try {
    const [original, subject] = await Promise.all([
      loadImage(sourceUrl),
      loadImage(cutoutUrl),
    ]);

    const width = original.naturalWidth;
    const height = original.naturalHeight;
    const bounds = getOpaqueBounds(subject);

    const pad = Math.ceil(Math.max(bounds.width, bounds.height) * 0.06);
    const cropW = bounds.width + pad * 2;
    const cropH = bounds.height + pad * 2;

    const subjectCrop = document.createElement("canvas");
    subjectCrop.width = cropW;
    subjectCrop.height = cropH;
    const cropCtx = subjectCrop.getContext("2d");
    if (!cropCtx) throw new Error("Canvas not supported");

    cropCtx.drawImage(
      subject,
      bounds.x - pad,
      bounds.y - pad,
      cropW,
      cropH,
      0,
      0,
      cropW,
      cropH,
    );

    const radians = (degrees * Math.PI) / 180;
    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));
    const rotW = Math.ceil(cropW * cos + cropH * sin);
    const rotH = Math.ceil(cropW * sin + cropH * cos);

    const rotCanvas = document.createElement("canvas");
    rotCanvas.width = rotW;
    rotCanvas.height = rotH;
    const rotCtx = rotCanvas.getContext("2d");
    if (!rotCtx) throw new Error("Canvas not supported");

    configureHighQualityCanvas(rotCtx);
    rotCtx.translate(rotW / 2, rotH / 2);
    rotCtx.rotate(radians);
    rotCtx.drawImage(subjectCrop, -cropW / 2, -cropH / 2);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    configureHighQualityCanvas(ctx);
    ctx.drawImage(original, 0, 0, width, height);

    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    const eraseScale = 1.06 + Math.min(Math.abs(degrees) / 45, 0.12);
    ctx.translate(bounds.centerX, bounds.centerY);
    ctx.scale(eraseScale, eraseScale);
    ctx.translate(-bounds.centerX, -bounds.centerY);
    ctx.drawImage(subject, 0, 0, width, height);
    ctx.restore();

    ctx.globalCompositeOperation = "source-over";
    const destX =
      bounds.x - pad + (cropW - rotW) / 2 + offsetX;
    const destY =
      bounds.y - pad + (cropH - rotH) / 2 + offsetY;
    ctx.drawImage(rotCanvas, destX, destY);

    return await canvasToBlobUrl(canvas, "image/png");
  } finally {
    URL.revokeObjectURL(cutoutUrl);
  }
};
