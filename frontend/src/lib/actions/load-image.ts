export function loadImage(
  src: string,
  crossOrigin = false,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) {
      img.crossOrigin = "anonymous";
    }
    img.onload = async () => {
      try {
        await img.decode();
      } catch {
        /* decode is optional */
      }
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

export function canvasToBlobUrl(
  canvas: HTMLCanvasElement,
  type = "image/png",
  quality = 1,
): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to export canvas"));
          return;
        }
        resolve(URL.createObjectURL(blob));
      },
      type,
      quality,
    );
  });
}
