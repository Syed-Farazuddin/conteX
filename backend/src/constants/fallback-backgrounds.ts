export type FallbackBackground = {
  url: string;
  tags: string[];
};

/** Curated high-res backgrounds tagged for keyword matching when stock APIs are unavailable. */
export const FALLBACK_BACKGROUNDS: FallbackBackground[] = [
  {
    url: "https://images.unsplash.com/photo-1557682250-33bdbd6b5726?fm=jpg&q=90&w=2400&auto=format&fit=crop",
    tags: ["gradient", "colorful", "abstract", "soft", "vivid", "elegant"],
  },
  {
    url: "https://images.unsplash.com/photo-1579546929662-711aa8117cf5?fm=jpg&q=90&w=2400&auto=format&fit=crop",
    tags: ["gradient", "blue", "soft", "smooth", "minimal", "abstract"],
  },
  {
    url: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?fm=jpg&q=90&w=2400&auto=format&fit=crop",
    tags: ["gradient", "pastel", "soft", "light", "elegant", "minimal"],
  },
  {
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?fm=jpg&q=90&w=2400&auto=format&fit=crop",
    tags: ["gradient", "dark", "elegant", "soft", "lighting", "abstract"],
  },
  {
    url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?fm=jpg&q=90&w=2400&auto=format&fit=crop",
    tags: ["bokeh", "soft", "lighting", "blur", "warm", "golden"],
  },
  {
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?fm=jpg&q=90&w=2400&auto=format&fit=crop",
    tags: ["office", "minimal", "clean", "studio", "professional", "white"],
  },
  {
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?fm=jpg&q=90&w=2400&auto=format&fit=crop",
    tags: ["mountain", "nature", "landscape", "outdoor", "sky"],
  },
  {
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?fm=jpg&q=90&w=2400&auto=format&fit=crop",
    tags: ["forest", "nature", "fog", "mist", "green", "landscape"],
  },
  {
    url: "https://plus.unsplash.com/premium_photo-1681426327290-1ec5fb4d3dd8?fm=jpg&q=90&w=2400&auto=format&fit=crop",
    tags: ["city", "urban", "night", "neon", "bokeh", "rooftop"],
  },
  {
    url: "https://images.unsplash.com/photo-1501785888041-af93ef12fa88?fm=jpg&q=90&w=2400&auto=format&fit=crop",
    tags: ["lake", "sunset", "golden", "hour", "landscape", "warm"],
  },
];

const DEFAULT_FALLBACK = FALLBACK_BACKGROUNDS[0].url;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

/** Pick the fallback whose tags best match the search query (never random). */
export function pickFallbackByQuery(query: string): string {
  const tokens = tokenize(query);
  if (tokens.length === 0) return DEFAULT_FALLBACK;

  let bestScore = -1;
  let bestUrl = DEFAULT_FALLBACK;

  for (const bg of FALLBACK_BACKGROUNDS) {
    let score = 0;
    for (const token of tokens) {
      for (const tag of bg.tags) {
        if (tag === token || tag.includes(token) || token.includes(tag)) {
          score += tag === token ? 2 : 1;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestUrl = bg.url;
    }
  }

  return bestUrl;
}
