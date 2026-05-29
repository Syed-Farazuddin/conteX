const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function triggerDownload(blobUrl: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function sanitizeFilename(name: string) {
  return name.replace(/[^\w.-]+/g, "-").replace(/-+/g, "-") || "contex-image";
}

async function fetchAsBlob(url: string): Promise<Blob> {
  if (url.startsWith("blob:") || url.startsWith("data:")) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Could not read image");
    }
    return response.blob();
  }

  const proxyUrl = `${API_BASE}/api/generate/asset?url=${encodeURIComponent(url)}`;
  const proxied = await fetch(proxyUrl);
  if (proxied.ok) {
    return proxied.blob();
  }

  const direct = await fetch(url);
  if (!direct.ok) {
    throw new Error("Could not download image");
  }
  return direct.blob();
}

export async function downloadImage(
  url: string,
  filename = "contex-image.jpg",
): Promise<void> {
  const safeName = sanitizeFilename(filename);
  const blob = await fetchAsBlob(url);
  const blobUrl = URL.createObjectURL(blob);
  try {
    triggerDownload(blobUrl, safeName);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}
