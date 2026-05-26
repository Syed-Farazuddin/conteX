export type GenerationStyleId =
  | "natural"
  | "ghibli"
  | "anime"
  | "cinematic"
  | "portrait"
  | "fantasy"
  | "vintage"
  | "clothing";

export type GenerationStyleDefinition = {
  id: GenerationStyleId;
  label: string;
  description: string;
  emoji: string;
  /** Prompt sent to Replicate (reference image preserved when supported). */
  promptTemplate: string;
  aspectRatio: string;
  /** Uses clothing cinematic pipeline instead of generic image model. */
  pipeline: "image" | "clothing";
};

export const GENERATION_STYLES: GenerationStyleDefinition[] = [
  {
    id: "natural",
    label: "Natural",
    description: "Realistic photo with clean lighting and true colors",
    emoji: "📷",
    promptTemplate:
      "High-quality photorealistic photograph based on the reference image. Natural lighting, accurate skin tones, sharp detail, professional color grading. Keep the same subject and composition.",
    aspectRatio: "1:1",
    pipeline: "image",
  },
  {
    id: "ghibli",
    label: "Ghibli",
    description: "Soft Studio Ghibli anime film still",
    emoji: "🌿",
    promptTemplate:
      "Transform into a Studio Ghibli anime film still: hand-painted watercolor backgrounds, soft pastel palette, gentle linework, expressive features, whimsical Miyazaki-inspired atmosphere. Keep the same pose and subject identity from the reference.",
    aspectRatio: "3:4",
    pipeline: "image",
  },
  {
    id: "anime",
    label: "Anime",
    description: "Bold modern anime illustration",
    emoji: "✨",
    promptTemplate:
      "Transform into high-quality modern anime illustration: clean cel shading, vivid colors, detailed eyes, dynamic lighting, manga-meets-animation look. Preserve the subject and pose from the reference image.",
    aspectRatio: "3:4",
    pipeline: "image",
  },
  {
    id: "cinematic",
    label: "Cinematic",
    description: "Moody film still with dramatic lighting",
    emoji: "🎬",
    promptTemplate:
      "Cinematic film still based on the reference: dramatic lighting, shallow depth of field, rich contrast, teal-and-orange color grade, anamorphic lens feel, blockbuster photography.",
    aspectRatio: "16:9",
    pipeline: "image",
  },
  {
    id: "portrait",
    label: "Portrait glow",
    description: "Soft beauty portrait with glowing skin",
    emoji: "💫",
    promptTemplate:
      "Professional beauty portrait from the reference: soft diffused key light, subtle glow on skin, creamy bokeh background, magazine editorial quality, flattering and natural.",
    aspectRatio: "3:4",
    pipeline: "image",
  },
  {
    id: "fantasy",
    label: "Fantasy",
    description: "Magical ethereal fantasy art",
    emoji: "🔮",
    promptTemplate:
      "Fantasy art transformation: magical atmosphere, ethereal lighting, subtle particles, enchanted environment, painterly detail while keeping the subject recognizable from the reference.",
    aspectRatio: "3:4",
    pipeline: "image",
  },
  {
    id: "vintage",
    label: "Vintage",
    description: "Retro film grain and warm tones",
    emoji: "📼",
    promptTemplate:
      "Vintage analog photograph: warm faded tones, subtle film grain, light leaks, 1970s editorial aesthetic. Same subject and framing as the reference image.",
    aspectRatio: "4:5",
    pipeline: "image",
  },
  {
    id: "clothing",
    label: "Fashion model",
    description: "On-model lookbook shot from your garment photo",
    emoji: "👗",
    promptTemplate: "",
    aspectRatio: "3:4",
    pipeline: "clothing",
  },
];

export function getGenerationStyle(
  id: string,
): GenerationStyleDefinition | undefined {
  return GENERATION_STYLES.find((s) => s.id === id);
}
