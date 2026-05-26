import type { Request, Response } from "express";
import { config } from "../config/index.js";
import { replicateService } from "../services/replicate.service.js";

export class ReplicateController {
  status(_req: Request, res: Response) {
    res.json({
      configured: replicateService.isConfigured(),
      defaultModel: config.replicateDefaultModel,
      backgroundModel: config.replicateBgModel,
    });
  }

  async run(req: Request, res: Response) {
    try {
      const { model, input, timeoutMs } = req.body ?? {};

      if (!input || typeof input !== "object" || Array.isArray(input)) {
        return res.status(400).json({
          success: false,
          message: "Provide `input` as a JSON object",
        });
      }

      const output = await replicateService.run({
        model: typeof model === "string" ? model : undefined,
        input: input as Record<string, unknown>,
        timeoutMs: typeof timeoutMs === "number" ? timeoutMs : undefined,
      });

      const url = replicateService.extractUrl(output);

      res.json({
        success: true,
        data: { output, url },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Replicate request failed";
      res.status(500).json({ success: false, message });
    }
  }

  async removeBackground(req: Request, res: Response) {
    try {
      const { imageUrl } = req.body ?? {};

      if (!imageUrl || typeof imageUrl !== "string") {
        return res.status(400).json({
          success: false,
          message: "Provide `imageUrl` (HTTPS URL to the source image)",
        });
      }

      const cutoutUrl = await replicateService.removeBackground(imageUrl);

      res.json({
        success: true,
        data: { url: cutoutUrl },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Background removal failed";
      res.status(500).json({ success: false, message });
    }
  }
}

export const replicateController = new ReplicateController();
