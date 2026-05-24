import type { PhotoActionFn } from "./types";

/** Removes the image background in the browser (WASM / ONNX). */
export const clearBackground: PhotoActionFn = async (sourceUrl, _params) => {
  const { removeBackground } = await import("@imgly/background-removal");

  const blob = await removeBackground(sourceUrl, {
    model: "isnet",
    rescale: false,
    output: {
      format: "image/png",
      quality: 1,
    },
  });

  return URL.createObjectURL(blob);
};
