export type ModelGender = "male" | "female";

export type ClothingStyleAnalysis = {
  garmentType: string;
  dominantColors: string[];
  style: string;
  mood: string;
  suggestedBackground: string;
  /** Inferred from garment cut/style for on-model shots */
  modelGender: ModelGender;
};

export type ClothingRenderResult = {
  sourceImageUrl: string;
  outputUrl: string;
  style: ClothingStyleAnalysis;
  cinematicPrompt: string;
  replicateInput: Record<string, unknown>;
  generatedAt: string;
};
