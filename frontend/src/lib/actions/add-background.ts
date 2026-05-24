import { pickRandomBackgroundImage } from "@/app/constants/constant";
import {
  analyzeSubjectFraming,
  assessCutoutQuality,
  computeSubjectPlacement,
  configureHighQualityCanvas,
  drawImageCover,
  drawSubjectCutout,
  getSubjectContentBounds,
  inferCompositeAspect,
  resolveCanvasSizeForFraming,
  resolveSmartPosition,
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
async function buildSubjectCutout(sourceUrl: string): Promise<string> {
  let cutoutUrl = await clearBackground(sourceUrl);
  let subject = await loadImage(cutoutUrl, false);
  let quality = assessCutoutQuality(subject, getSubjectContentBounds(subject));

  if (quality.clearlyFailed) {
    URL.revokeObjectURL(cutoutUrl);
    cutoutUrl = await clearBackground(sourceUrl);
    subject = await loadImage(cutoutUrl, false);
    quality = assessCutoutQuality(subject, getSubjectContentBounds(subject));
  }

  if (quality.clearlyFailed) {
    console.warn(
      "[add-background] cutout still looks opaque after retry; compositing anyway",
    );
  }

  return cutoutUrl;
}

export const backgroundAdder: PhotoActionFn = async (sourceUrl, params) => {
  const position = resolvePosition(params?.position);
  const cutoutUrl = await buildSubjectCutout(sourceUrl);
  const backgroundUrl = params?.backgroundUrl ?? pickRandomBackgroundImage();

  try {
    const [background, subject] = await Promise.all([
      loadImage(backgroundUrl, backgroundUrl.startsWith("http")),
      loadImage(cutoutUrl, false),
    ]);

    const contentBounds = getSubjectContentBounds(subject);
    const framing = contentBounds
      ? analyzeSubjectFraming(subject, contentBounds)
      : null;

    const targetAspect = inferCompositeAspect(
      framing,
      subject,
      params?.backgroundOrientation,
    );

    const { width, height } = resolveCanvasSizeForFraming(
      background,
      subject,
      framing,
      contentBounds,
      { targetAspect },
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    configureHighQualityCanvas(ctx);
    drawImageCover(ctx, background, width, height);

    const smartPosition = framing
      ? resolveSmartPosition(position, framing)
      : position;

    const { x, y, w, h, sx, sy, sw, sh } = computeSubjectPlacement(
      width,
      height,
      subject,
      smartPosition,
      contentBounds,
      {
        maximizeFill: true,
        placementMode: framing?.mode ?? "default",
      },
    );

    drawSubjectCutout(ctx, subject, { x, y, w, h, sx, sy, sw, sh });

    return await canvasToBlobUrl(canvas, "image/png");
  } finally {
    URL.revokeObjectURL(cutoutUrl);
  }
};
