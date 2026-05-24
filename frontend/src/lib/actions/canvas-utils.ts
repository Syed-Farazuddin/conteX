const MAX_OUTPUT_EDGE = 4096;
/** Upscale beyond this factor blurs the cutout (main cause of mushy edges). */
const MAX_SUBJECT_UPSCALE = 1.3;

export type CanvasSize = { width: number; height: number };

export type CanvasSizeOptions = {
  /** Target width/height ratio (e.g. 9/16 for vertical social). */
  targetAspect?: number;
};

/** Prefer full-resolution output; only shrink when over device-safe max. */
export function resolveCanvasSize(
  background: HTMLImageElement,
  subject: HTMLImageElement,
  options?: CanvasSizeOptions,
): CanvasSize {
  const bgMin = Math.min(background.naturalWidth, background.naturalHeight);
  const subW = subject.naturalWidth;
  const subH = subject.naturalHeight;
  const targetAspect = options?.targetAspect;

  let width: number;
  let height: number;

  const portraitSubject = subH > subW * 1.05;
  const aspect = targetAspect ?? (portraitSubject ? 9 / 16 : undefined);

  if (aspect != null && aspect > 0) {
    const portrait = aspect < 1;
    if (portrait) {
      height = Math.max(1920, background.naturalHeight, Math.round(subH * 1.1));
      width = Math.round(height * aspect);
    } else {
      width = Math.max(1920, background.naturalWidth, Math.round(subW * 1.1));
      height = Math.round(width / aspect);
    }
  } else if (bgMin < 800) {
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

function clampCanvasSize(width: number, height: number): CanvasSize {
  const edge = Math.max(width, height);
  if (edge > MAX_OUTPUT_EDGE) {
    const scale = MAX_OUTPUT_EDGE / edge;
    return {
      width: Math.round(width * scale),
      height: Math.round(height * scale),
    };
  }
  return { width, height };
}

/**
 * Size the canvas so crop-aware placement can fill the frame without upscaling past MAX_SUBJECT_UPSCALE.
 */
export function resolveCanvasSizeForFraming(
  background: HTMLImageElement,
  subject: HTMLImageElement,
  framing: SubjectFraming | null,
  contentBounds: SubjectContentBounds | null,
  options?: CanvasSizeOptions,
): CanvasSize {
  if (!framing || framing.mode === "default" || !contentBounds) {
    return resolveCanvasSize(background, subject, options);
  }

  const subH = contentBounds.height;
  const subW = contentBounds.width;
  const aspect = options?.targetAspect ?? (subH > subW ? 9 / 16 : subW / subH);

  if (framing.mode === "edge-stretch") {
    const height = Math.max(960, Math.round(subH * MAX_SUBJECT_UPSCALE));
    const width = Math.max(540, Math.round(height * aspect));
    return clampCanvasSize(width, height);
  }

  if (framing.mode === "anchor-bottom") {
    const headroom = framing.headTouchesTop ? 1 : 1.06;
    const height = Math.max(
      960,
      Math.round(subH * MAX_SUBJECT_UPSCALE * headroom),
    );
    const width = Math.max(540, Math.round(height * aspect));
    return clampCanvasSize(width, height);
  }

  return resolveCanvasSize(background, subject, options);
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

export type CutoutQuality = {
  transparentRatio: number;
  opaqueFillRatio: number;
  isValid: boolean;
  clearlyFailed: boolean;
};

function sampleAlpha(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
): number {
  const ix = Math.min(width - 1, Math.max(0, Math.round(x)));
  const iy = Math.min(height - 1, Math.max(0, Math.round(y)));
  return data[(iy * width + ix) * 4 + 3];
}

/** Detect failed background removal (opaque rectangle pasted on scene). */
export function assessCutoutQuality(
  image: HTMLImageElement,
  bounds: SubjectContentBounds | null,
): CutoutQuality {
  if (!bounds) {
    return {
      transparentRatio: 0,
      opaqueFillRatio: 1,
      isValid: false,
      clearlyFailed: true,
    };
  }

  const sampleW = Math.min(240, image.naturalWidth);
  const sampleH = Math.min(240, image.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return {
      transparentRatio: 0,
      opaqueFillRatio: 1,
      isValid: true,
      clearlyFailed: false,
    };
  }

  ctx.drawImage(image, 0, 0, sampleW, sampleH);
  const { data } = ctx.getImageData(0, 0, sampleW, sampleH);

  let transparent = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 32) transparent++;
  }
  const transparentRatio = transparent / (sampleW * sampleH);
  const opaqueFillRatio =
    (bounds.width * bounds.height) / (image.naturalWidth * image.naturalHeight);

  const cornerPoints: [number, number][] = [
    [0.06, 0.06],
    [0.94, 0.06],
    [0.06, 0.94],
    [0.94, 0.94],
    [0.5, 0.04],
    [0.5, 0.96],
  ];
  let transparentCorners = 0;
  for (const [px, py] of cornerPoints) {
    if (sampleAlpha(data, sampleW, sampleH, px * sampleW, py * sampleH) < 48) {
      transparentCorners++;
    }
  }

  const hasEdgeTransparency = transparentCorners >= 2;
  const clearlyFailed =
    !hasEdgeTransparency && transparentRatio < 0.012 && opaqueFillRatio > 0.92;

  return {
    transparentRatio,
    opaqueFillRatio,
    isValid: !clearlyFailed,
    clearlyFailed,
  };
}

export function inferCompositeAspect(
  framing: SubjectFraming | null,
  subject: HTMLImageElement,
  backgroundOrientation?: "landscape" | "portrait" | "square",
): number | undefined {
  if (backgroundOrientation === "portrait") return 9 / 16;
  if (backgroundOrientation === "square") return 1;
  if (
    framing?.isPortraitSubject ||
    subject.naturalHeight > subject.naturalWidth
  ) {
    return 9 / 16;
  }
  return undefined;
}

/** How a partially cropped source photo should be aligned on the background. */
export type SubjectPlacementMode =
  | "default"
  /** Waist-up / legs cut off — anchor subject to frame bottom. */
  | "anchor-bottom"
  /** Cropped at both top and bottom in source — fill frame from y=0 to y=height. */
  | "edge-stretch";

export type SubjectFraming = {
  headTouchesTop: boolean;
  baseTouchesBottom: boolean;
  subjectFillY: number;
  isPortraitSubject: boolean;
  mode: SubjectPlacementMode;
};

export function analyzeSubjectFraming(
  image: HTMLImageElement,
  bounds: SubjectContentBounds,
): SubjectFraming {
  const imgH = image.naturalHeight;
  const gapTop = bounds.y / imgH;
  const gapBottom = (imgH - (bounds.y + bounds.height)) / imgH;
  const headTouchesTop = gapTop < 0.06;
  const baseTouchesBottom = gapBottom < 0.06;
  const subjectFillY = bounds.height / imgH;
  const isPortraitSubject = bounds.height > bounds.width * 1.05;
  const subjectCenterY = (bounds.y + bounds.height / 2) / imgH;

  let mode: SubjectPlacementMode = "default";

  const tightVerticalCrop =
    headTouchesTop &&
    subjectFillY >= 0.55 &&
    (baseTouchesBottom || gapBottom < 0.22);

  if (tightVerticalCrop) {
    mode = "edge-stretch";
  } else if (
    baseTouchesBottom ||
    (headTouchesTop && isPortraitSubject && subjectFillY >= 0.32) ||
    (isPortraitSubject && subjectCenterY > 0.52 && subjectFillY >= 0.4)
  ) {
    mode = "anchor-bottom";
  }

  return {
    headTouchesTop,
    baseTouchesBottom,
    subjectFillY,
    isPortraitSubject,
    mode,
  };
}

/** Map detected crop style to placement insets. */
export function resolveSmartPosition(
  ai: SubjectPosition,
  framing: SubjectFraming,
): SubjectPosition {
  const sideCap = framing.isPortraitSubject ? 10 : 12;
  const left = Math.min(Math.max(ai.left, 5), sideCap);
  const right = Math.min(Math.max(ai.right, 5), sideCap);
  const horizontalAlign = ai.horizontalAlign ?? "center";

  if (framing.mode === "edge-stretch") {
    return {
      ...ai,
      top: 0,
      bottom: 0,
      left,
      right,
      verticalAlign: "top",
      horizontalAlign,
    };
  }

  if (framing.mode === "anchor-bottom") {
    return {
      ...ai,
      top: framing.headTouchesTop ? 0 : Math.min(ai.top, 6),
      bottom: 0,
      left,
      right,
      verticalAlign: "bottom",
      horizontalAlign,
    };
  }

  const verticalAlign = ai.verticalAlign ?? "bottom";
  if (verticalAlign !== "bottom") return ai;

  const top = framing.headTouchesTop
    ? Math.min(ai.top, 3)
    : framing.isPortraitSubject
      ? Math.min(ai.top, 8)
      : Math.min(ai.top, 12);

  return {
    ...ai,
    top,
    bottom: Math.min(ai.bottom, 1),
    left,
    right,
    verticalAlign: "bottom",
    horizontalAlign,
  };
}

/** Remove only obvious black matting — keep semi-transparent hair/edge pixels. */
function stripBlackMattePixels(data: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 8) {
      data[i + 3] = 0;
      continue;
    }

    const maxC = Math.max(r, g, b);
    if (maxC < 14 && a < 90) {
      data[i + 3] = 0;
    }
  }
}

/**
 * Draw cutout at final destination resolution (single high-quality scale step).
 */
export function drawSubjectCutout(
  ctx: CanvasRenderingContext2D,
  subject: HTMLImageElement,
  placement: SubjectPlacement,
) {
  const { x, y, w, h, sx, sy, sw, sh } = placement;
  const dw = Math.max(1, Math.round(w));
  const dh = Math.max(1, Math.round(h));

  if (sw < 1 || sh < 1) return;

  const temp = document.createElement("canvas");
  temp.width = dw;
  temp.height = dh;
  const tctx = temp.getContext("2d", { willReadFrequently: true });
  if (!tctx) {
    configureHighQualityCanvas(ctx);
    ctx.drawImage(subject, sx, sy, sw, sh, x, y, dw, dh);
    return;
  }

  configureHighQualityCanvas(tctx);
  tctx.drawImage(subject, sx, sy, sw, sh, 0, 0, dw, dh);

  const imageData = tctx.getImageData(0, 0, dw, dh);
  stripBlackMattePixels(imageData.data);
  tctx.putImageData(imageData, 0, 0);

  configureHighQualityCanvas(ctx);
  ctx.drawImage(temp, x, y);
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
  options?: { maximizeFill?: boolean; placementMode?: SubjectPlacementMode },
): SubjectPlacement {
  const placementMode = options?.placementMode ?? "default";
  const marginTop = (position.top / 100) * canvasH;
  const marginLeft = (position.left / 100) * canvasW;
  const marginRight = (position.right / 100) * canvasW;
  const marginBottom = (position.bottom / 100) * canvasH;

  const boxW = Math.max(1, canvasW - marginLeft - marginRight);

  const sx = contentBounds?.x ?? 0;
  const sy = contentBounds?.y ?? 0;
  const subW = contentBounds?.width ?? subject.naturalWidth;
  const subH = contentBounds?.height ?? subject.naturalHeight;

  const hAlign = position.horizontalAlign ?? "center";
  const vAlign = position.verticalAlign ?? "bottom";

  let x: number;
  let y: number;
  let w: number;
  let h: number;

  if (placementMode === "edge-stretch") {
    const scale = Math.min(canvasH / subH, boxW / subW);
    w = subW * scale;
    h = subH * scale;
    y = 0;
    if (hAlign === "left") x = marginLeft;
    else if (hAlign === "right") x = canvasW - marginRight - w;
    else x = (canvasW - w) / 2;
  } else if (placementMode === "anchor-bottom") {
    const maxH = Math.max(1, canvasH - marginTop - marginBottom);
    const scale = Math.min(boxW / subW, maxH / subH, MAX_SUBJECT_UPSCALE);
    w = subW * scale;
    h = subH * scale;

    if (hAlign === "left") x = marginLeft;
    else if (hAlign === "right") x = marginLeft + boxW - w;
    else x = marginLeft + (boxW - w) / 2;

    y = canvasH - h - marginBottom;
  } else {
    const maxH = Math.max(1, canvasH - marginTop - marginBottom);
    const scaleCap = options?.maximizeFill ? MAX_SUBJECT_UPSCALE : 1.15;
    const scale = Math.min(boxW / subW, maxH / subH, scaleCap);
    w = subW * scale;
    h = subH * scale;

    if (hAlign === "left") x = marginLeft;
    else if (hAlign === "right") x = marginLeft + boxW - w;
    else x = marginLeft + (boxW - w) / 2;

    if (vAlign === "top") {
      y = marginTop;
    } else if (vAlign === "bottom") {
      y = canvasH - h - marginBottom;
    } else {
      y = marginTop + (maxH - h) / 2;
    }
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

/** Vertical crop that keeps the bottom of the frame (grounded subjects). */
export function bottomAnchoredCropRect(
  srcW: number,
  srcH: number,
  targetRatio: number,
) {
  const crop = centerCropRect(srcW, srcH, targetRatio);
  if (crop.height < srcH) {
    return { ...crop, y: srcH - crop.height };
  }
  if (crop.width < srcW) {
    return { ...crop, x: Math.round((srcW - crop.width) / 2) };
  }
  return crop;
}

export const RESIZE_PRESETS = {
  "1080p": { width: 1920, height: 1080 },
  vertical: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
} as const;
