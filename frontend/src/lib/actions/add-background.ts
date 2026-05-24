import { pickRandomBackgroundImage } from "@/app/constants/constant";
import {
  computeSubjectPlacement,
  configureHighQualityCanvas,
  drawImageCover,
  resolveCanvasSize,
} from "./canvas-utils";
import { clearBackground } from "./clear-background";
import { canvasToBlobUrl, loadImage } from "./load-image";
import {
  DEFAULT_SUBJECT_POSITION,
  type PhotoActionFn,
  type SubjectPosition,
} from "./types";

function resolvePosition(position?: Partial<SubjectPosition>): SubjectPosition {
  return {
    top: position?.top ?? DEFAULT_SUBJECT_POSITION.top,
    left: position?.left ?? DEFAULT_SUBJECT_POSITION.left,
    right: position?.right ?? DEFAULT_SUBJECT_POSITION.right,
    bottom: position?.bottom ?? DEFAULT_SUBJECT_POSITION.bottom,
  };
}

/**
 * Removes the subject background, composites onto a random catalog background,
 * and places the subject using top / left / right / bottom inset percentages.
 */
export const backgroundAdder: PhotoActionFn = async (sourceUrl, params) => {
  const position = resolvePosition(params?.position);
  const cutoutUrl = await clearBackground(sourceUrl);
  const backgroundUrl = pickRandomBackgroundImage();

  try {
    const [background, subject] = await Promise.all([
      loadImage(backgroundUrl, true),
      loadImage(cutoutUrl, false),
    ]);

    const { width, height } = resolveCanvasSize(background, subject);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    configureHighQualityCanvas(ctx);
    drawImageCover(ctx, background, width, height);

    const { x, y, w, h } = computeSubjectPlacement(
      width,
      height,
      subject,
      position,
    );
    ctx.drawImage(subject, x, y, w, h);

    return await canvasToBlobUrl(canvas, "image/png");
  } finally {
    URL.revokeObjectURL(cutoutUrl);
  }
};
