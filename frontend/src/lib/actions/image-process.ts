import {
  aspectRatioValue,
  centerCropRect,
  configureHighQualityCanvas,
  drawImageCover,
  RESIZE_PRESETS,
} from "./canvas-utils";
import { canvasToBlobUrl, loadImage } from "./load-image";
import type { AspectRatioKey, PhotoActionFn, PhotoActionParams, ResizePresetKey } from "./types";

async function exportCanvas(canvas: HTMLCanvasElement) {
  return canvasToBlobUrl(canvas, "image/png");
}

export function createCropAction(ratio: AspectRatioKey): PhotoActionFn {
  return async (sourceUrl) => {
    const img = await loadImage(sourceUrl);
    const targetRatio = aspectRatioValue(ratio);
    const crop = centerCropRect(img.naturalWidth, img.naturalHeight, targetRatio);

    const canvas = document.createElement("canvas");
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    configureHighQualityCanvas(ctx);
    ctx.drawImage(
      img,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height,
    );

    return exportCanvas(canvas);
  };
}

export function createResizeAction(preset: ResizePresetKey): PhotoActionFn {
  return async (sourceUrl) => {
    const img = await loadImage(sourceUrl);
    const { width, height } = RESIZE_PRESETS[preset];

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    configureHighQualityCanvas(ctx);
    drawImageCover(ctx, img, width, height);

    return exportCanvas(canvas);
  };
}

export const adjustEnhance: PhotoActionFn = async (sourceUrl, params) => {
  const img = await loadImage(sourceUrl);
  const brightness = params?.brightness ?? 1.06;
  const contrast = params?.contrast ?? 1.12;
  const saturation = params?.saturation ?? 1.1;

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  configureHighQualityCanvas(ctx);
  ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`;
  ctx.drawImage(img, 0, 0);

  return exportCanvas(canvas);
};

export const rotate90: PhotoActionFn = async (sourceUrl) => {
  const img = await loadImage(sourceUrl);

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalHeight;
  canvas.height = img.naturalWidth;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  configureHighQualityCanvas(ctx);
  ctx.translate(canvas.width, 0);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(img, 0, 0);

  return exportCanvas(canvas);
};

export const flipHorizontal: PhotoActionFn = async (sourceUrl) => {
  const img = await loadImage(sourceUrl);

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  configureHighQualityCanvas(ctx);
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(img, 0, 0);

  return exportCanvas(canvas);
};
