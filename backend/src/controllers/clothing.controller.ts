import type { Request, Response } from "express";
import { config } from "../config/index.js";
import { aiService } from "../services/ai.service.js";
import { clothingService } from "../services/clothing.service.js";
import { replicateService } from "../services/replicate.service.js";

export class ClothingController {
  status(_req: Request, res: Response) {
    res.json({
      configured: clothingService.isConfigured(),
      replicate: replicateService.isConfigured(),
      styleAnalysis: aiService.isConfigured(),
      clothingModel: config.replicateClothingModel,
      backgroundModel: config.replicateBgModel,
    });
  }

  async render(req: Request, res: Response) {
    try {
      const { imageBase64, imageUrl, aspectRatio, prompt } = req.body ?? {};

      const image =
        typeof imageBase64 === "string"
          ? imageBase64
          : typeof imageUrl === "string"
            ? imageUrl
            : undefined;

      if (!image) {
        return res.status(400).json({
          success: false,
          message:
            "Provide `imageBase64` (data URL or raw base64) or `imageUrl`",
        });
      }

      const result = await clothingService.renderCinematic({
        image,
        aspectRatio: typeof aspectRatio === "string" ? aspectRatio : undefined,
        prompt: typeof prompt === "string" ? prompt : undefined,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Clothing render failed";
      res.status(500).json({ success: false, message });
    }
  }
}

export const clothingController = new ClothingController();
