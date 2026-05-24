export const images = [
  "https://images.unsplash.com/photo-1557682250-33bdbd6b5726?fm=jpg&q=90&w=2400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1579546929662-711aa8117cf5?fm=jpg&q=90&w=2400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?fm=jpg&q=90&w=2400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?fm=jpg&q=90&w=2400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?fm=jpg&q=90&w=2400&auto=format&fit=crop",
  "https://plus.unsplash.com/premium_photo-1681426327290-1ec5fb4d3dd8?fm=jpg&q=90&w=2400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af93ef12fa88?fm=jpg&q=90&w=2400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?fm=jpg&q=90&w=2400&auto=format&fit=crop",
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
