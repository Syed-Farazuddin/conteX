const MAX_BYTES = 12 * 1024 * 1024;

export async function fetchImageAsDataUrl(
  url: string,
): Promise<string | undefined> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(120_000),
      headers: { "User-Agent": "ConteX-Backend/1.0" },
    });
    if (!response.ok) return undefined;

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0 || buffer.length > MAX_BYTES) return undefined;

    const mime =
      response.headers.get("content-type")?.split(";")[0]?.trim() ||
      "image/jpeg";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return undefined;
  }
}

export function isAllowedRemoteImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    return (
      host.endsWith("replicate.delivery") ||
      host.endsWith("replicate.com") ||
      host.endsWith("pbxt.replicate.delivery") ||
      host.endsWith("googleusercontent.com") ||
      host === "localhost" ||
      host === "127.0.0.1"
    );
  } catch {
    return false;
  }
}
