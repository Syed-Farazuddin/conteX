const MAX_OUTPUT_EDGE = 4096;

export type CanvasSize = { width: number; height: number };

/** Prefer full-resolution output; only shrink when over device-safe max. */
export function resolveCanvasSize(
  background: HTMLImageElement,
  subject: HTMLImageElement,
): CanvasSize {
  const bgMin = Math.min(background.naturalWidth, background.naturalHeight);
  const subW = subject.naturalWidth;
  const subH = subject.naturalHeight;

  // Tiny catalog thumbs (e.g. gstatic) — size canvas from the subject instead
  let width: number;
  let height: number;

  if (bgMin < 800) {
    width = Math.max(subW, 1920);
    height = Math.round((width / subW) * subH);
  } else {
    width = background.naturalWidth;
    height = background.naturalHeight;
  }

  const edge = Math.max(width, height);
  if (edge > MAX_OUTPUT_EDGE) {
    const scale = MAX_OUTPUT_EDGE / edge;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  return { width, height };
}

/** Cover-fit image into the canvas (no letterboxing). */
export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const imgRatio = image.naturalWidth / image.naturalHeight;
  const canvasRatio = width / height;

  let sx = 0;
  let sy = 0;
  let sw = image.naturalWidth;
  let sh = image.naturalHeight;

  if (imgRatio > canvasRatio) {
    sw = Math.round(image.naturalHeight * canvasRatio);
    sx = Math.round((image.naturalWidth - sw) / 2);
  } else {
    sh = Math.round(image.naturalWidth / canvasRatio);
    sy = Math.round((image.naturalHeight - sh) / 2);
  }

  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
}

export function configureHighQualityCanvas(ctx: CanvasRenderingContext2D) {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
}

export type SubjectPosition = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  verticalAlign?: "top" | "center" | "bottom";
  horizontalAlign?: "left" | "center" | "right";
};

/** Place subject inside a box defined by % insets from each edge. */
export function computeSubjectPlacement(
  canvasW: number,
  canvasH: number,
  subject: HTMLImageElement,
  position: SubjectPosition,
) {
  const top = (position.top / 100) * canvasH;
  const left = (position.left / 100) * canvasW;
  const right = (position.right / 100) * canvasW;
  const bottom = (position.bottom / 100) * canvasH;

  const boxW = Math.max(1, canvasW - left - right);
  const boxH = Math.max(1, canvasH - top - bottom);

  const scale = Math.min(
    boxW / subject.naturalWidth,
    boxH / subject.naturalHeight,
    1.8,
  );
  const w = subject.naturalWidth * scale;
  const h = subject.naturalHeight * scale;

  const vAlign = position.verticalAlign ?? "bottom";
  const hAlign = position.horizontalAlign ?? "center";

  let x: number;
  if (hAlign === "left") x = left;
  else if (hAlign === "right") x = left + boxW - w;
  else x = left + (boxW - w) / 2;

  let y: number;
  if (vAlign === "top") y = top;
  else if (vAlign === "bottom") y = top + boxH - h;
  else y = top + (boxH - h) / 2;

  return { x, y, w, h };
}

export function aspectRatioValue(key: string): number {
  switch (key) {
    case "16:9":
      return 16 / 9;
    case "9:16":
      return 9 / 16;
    case "1:1":
      return 1;
    case "4:5":
      return 4 / 5;
    default:
      return 16 / 9;
  }
}

export function centerCropRect(
  srcW: number,
  srcH: number,
  targetRatio: number,
) {
  const srcRatio = srcW / srcH;
  let cropW = srcW;
  let cropH = srcH;

  if (srcRatio > targetRatio) {
    cropW = Math.round(srcH * targetRatio);
  } else {
    cropH = Math.round(srcW / targetRatio);
  }

  return {
    x: Math.round((srcW - cropW) / 2),
    y: Math.round((srcH - cropH) / 2),
    width: cropW,
    height: cropH,
  };
}

export const RESIZE_PRESETS = {
  "1080p": { width: 1920, height: 1080 },
  vertical: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
} as const;
