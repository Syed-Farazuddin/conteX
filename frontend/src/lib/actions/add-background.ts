import { pickRandomBackgroundImage } from "@/app/constants/constant";
import {
  computeSubjectPlacement,
  configureHighQualityCanvas,
  drawImageCover,
  getSubjectContentBounds,
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
    verticalAlign:
      position?.verticalAlign ?? DEFAULT_SUBJECT_POSITION.verticalAlign,
    horizontalAlign:
      position?.horizontalAlign ?? DEFAULT_SUBJECT_POSITION.horizontalAlign,
  };
}

/**
 * Removes the subject background, composites onto a random catalog background,
 * and places the subject using top / left / right / bottom inset percentages.
 * Uses params.backgroundUrl from AI when provided, otherwise local catalog.
 */
export const backgroundAdder: PhotoActionFn = async (sourceUrl, params) => {
  const position = resolvePosition(params?.position);
  const cutoutUrl = await clearBackground(sourceUrl);
  const backgroundUrl = params?.backgroundUrl ?? pickRandomBackgroundImage();

  try {
    const [background, subject] = await Promise.all([
      loadImage(backgroundUrl, backgroundUrl.startsWith("http")),
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

    const contentBounds = getSubjectContentBounds(subject);
    const { x, y, w, h, sx, sy, sw, sh } = computeSubjectPlacement(
      width,
      height,
      subject,
      position,
      contentBounds,
    );
    ctx.drawImage(subject, sx, sy, sw, sh, x, y, w, h);

    return await canvasToBlobUrl(canvas, "image/png");
  } finally {
    URL.revokeObjectURL(cutoutUrl);
  }
};
