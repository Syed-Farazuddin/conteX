export const images = [
  "https://plus.unsplash.com/premium_photo-1681426327290-1ec5fb4d3dd8?fm=jpg&q=90&w=2400&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Y29vbCUyMGJhY2tncm91bmR8ZW58MHx8MHx8fDA%3D",
  // Use full-size URLs only — small thumbnails destroy composite quality
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?fm=jpg&q=90&w=2400&auto=format&fit=crop",
];

/** Request higher JPEG quality / width from Unsplash-style URLs. */
export function toHighQualityImageUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("unsplash.com")) {
      parsed.searchParams.set("q", "90");
      parsed.searchParams.set("w", "2400");
      parsed.searchParams.set("fm", "jpg");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

/** Picks a random background URL from the catalog (high-quality when possible). */
export function pickRandomBackgroundImage(): string {
  const url = images[Math.floor(Math.random() * images.length)];
  return toHighQualityImageUrl(url);
}
