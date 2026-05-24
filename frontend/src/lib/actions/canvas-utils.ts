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

export type SubjectContentBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SubjectPlacement = {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Source crop when transparent padding was trimmed from the cutout. */
  sx: number;
  sy: number;
  sw: number;
  sh: number;
};

/** Tight bounds around non-transparent pixels (background-removal cutouts often have empty padding). */
export function getSubjectContentBounds(
  image: HTMLImageElement,
  alphaThreshold = 12,
): SubjectContentBounds | null {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(image, 0, 0);
  const { data, width, height } = ctx.getImageData(
    0,
    0,
    canvas.width,
    canvas.height,
  );

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > alphaThreshold) {
        found = true;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!found) return null;

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

/**
 * Place subject on canvas.
 * - top / left / right: % insets defining the horizontal band and max height.
 * - bottom + verticalAlign "bottom": margin below the visible subject (0 = flush to frame bottom).
 * - verticalAlign "top" | "center": bottom is also an inset from the frame bottom (placement box).
 */
export function computeSubjectPlacement(
  canvasW: number,
  canvasH: number,
  subject: HTMLImageElement,
  position: SubjectPosition,
  contentBounds?: SubjectContentBounds | null,
): SubjectPlacement {
  const marginTop = (position.top / 100) * canvasH;
  const marginLeft = (position.left / 100) * canvasW;
  const marginRight = (position.right / 100) * canvasW;
  const marginBottom = (position.bottom / 100) * canvasH;

  const boxW = Math.max(1, canvasW - marginLeft - marginRight);

  const sx = contentBounds?.x ?? 0;
  const sy = contentBounds?.y ?? 0;
  const subW = contentBounds?.width ?? subject.naturalWidth;
  const subH = contentBounds?.height ?? subject.naturalHeight;

  const vAlign = position.verticalAlign ?? "bottom";
  const hAlign = position.horizontalAlign ?? "center";

  const maxH =
    vAlign === "bottom"
      ? Math.max(1, canvasH - marginTop - marginBottom)
      : Math.max(1, canvasH - marginTop - marginBottom);

  const scale = Math.min(boxW / subW, maxH / subH, 1.8);
  const w = subW * scale;
  const h = subH * scale;

  let x: number;
  if (hAlign === "left") x = marginLeft;
  else if (hAlign === "right") x = marginLeft + boxW - w;
  else x = marginLeft + (boxW - w) / 2;

  let y: number;
  if (vAlign === "top") {
    y = marginTop;
  } else if (vAlign === "bottom") {
    // Feet sit on the frame bottom; `bottom` is only a small margin below visible pixels.
    y = canvasH - h - marginBottom;
  } else {
    y = marginTop + (maxH - h) / 2;
  }

  return {
    x,
    y,
    w,
    h,
    sx,
    sy,
    sw: subW,
    sh: subH,
  };
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
