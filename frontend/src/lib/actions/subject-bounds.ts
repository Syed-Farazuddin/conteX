export type OpaqueBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
};

/** Bounding box of non-transparent pixels (subject silhouette). */
export function getOpaqueBounds(image: HTMLImageElement): OpaqueBounds {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return fallbackBounds(image);
  }

  ctx.drawImage(image, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  const step = 4;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 24) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (minX >= maxX || minY >= maxY) {
    return fallbackBounds(image);
  }

  const boundsW = maxX - minX + 1;
  const boundsH = maxY - minY + 1;

  return {
    x: minX,
    y: minY,
    width: boundsW,
    height: boundsH,
    centerX: minX + boundsW / 2,
    centerY: minY + boundsH / 2,
  };
}

function fallbackBounds(image: HTMLImageElement): OpaqueBounds {
  const w = image.naturalWidth;
  const h = image.naturalHeight;
  return {
    x: 0,
    y: 0,
    width: w,
    height: h,
    centerX: w / 2,
    centerY: h / 2,
  };
}
