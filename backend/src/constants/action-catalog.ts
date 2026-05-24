/** Action keys the AI is allowed to recommend — keep in sync with frontend action map. */
export const AI_ACTION_CATALOG = [
  {
    key: "adjust-enhance",
    description:
      "Boost brightness, contrast, saturation — use when image looks flat or dull",
    params: {
      brightness: "REQUIRED multiplier 0.85-1.25 (1.0 = unchanged, dark image → 1.08-1.18)",
      contrast: "REQUIRED multiplier 0.85-1.35 (1.0 = unchanged, flat image → 1.05-1.2)",
      saturation: "REQUIRED multiplier 0.8-1.3 (1.0 = unchanged, dull colors → 1.05-1.15)",
    },
  },
  {
    key: "rotate-90",
    description:
      "Rotate entire image 90° clockwise — only if clearly wrong orientation",
  },
  {
    key: "flip-horizontal",
    description: "Mirror image — rarely needed",
  },
  {
    key: "clear-background",
    description:
      "Remove background, transparent subject — portrait/product focus",
  },
  {
    key: "add-background",
    description:
      "Remove background and place subject on a stock photo scene — best for portraits",
    params: {
      position: {
        top: "0-45 inset from top — larger for full-body (28-42)",
        left: "0-45 — increase on side with background clutter to shift subject away",
        right: "0-45 — increase on side with open space",
        bottom: "0-3 margin below feet when verticalAlign is bottom (0 = flush to frame bottom)",
        verticalAlign: "bottom for people/products with a base, center for logos",
        horizontalAlign: "left | center | right — place in clear negative space, never on statues/focal objects",
      },
      backgroundScene:
        "Human-readable scene description shown in the UI (mood, place, lighting). Prefer backgrounds with open foreground space.",
      backgroundSearchQuery:
        "REQUIRED: 2–6 keywords — include 'open space' or 'empty foreground' for portrait compositing",
      backgroundOrientation: "landscape | portrait | square — match final crop",
    },
  },
  {
    key: "crop-16-9",
    description: "Landscape video frame — YouTube, TV",
  },
  {
    key: "crop-9-16",
    description: "Vertical video frame — Reels, TikTok, Shorts",
  },
  {
    key: "crop-1-1",
    description: "Square — Instagram posts, profile",
  },
  {
    key: "resize-1080p",
    description: "Export 1920×1080 landscape HD",
  },
  {
    key: "resize-vertical",
    description: "Export 1080×1920 vertical HD",
  },
] as const;

export const ALLOWED_ACTION_KEYS = AI_ACTION_CATALOG.map((a) => a.key);
