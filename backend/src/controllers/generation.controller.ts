import type { Request, Response } from "express";
import { config } from "../config/index.js";
import { generationService } from "../services/generation.service.js";
import {
  isAllowedRemoteImageUrl,
} from "../utils/fetch-image-base64.js";

export class GenerationController {
  listStyles(_req: Request, res: Response) {
    res.json({
      configured: generationService.isConfigured(),
      generationModel: config.replicateGenerationModel,
      styles: generationService.listStyles(),
    });
  }

  async generate(req: Request, res: Response) {
    try {
      const { styleId, imageBase64, imageUrl, aspectRatio, prompt } =
        req.body ?? {};

      if (typeof styleId !== "string" || !styleId.trim()) {
        return res.status(400).json({
          success: false,
          message: "Provide `styleId` (e.g. natural, ghibli, anime)",
        });
      }

      const image =
        typeof imageBase64 === "string"
          ? imageBase64
          : typeof imageUrl === "string"
            ? imageUrl
            : undefined;

      if (!image) {
        return res.status(400).json({
          success: false,
          message: "Provide `imageBase64` or `imageUrl`",
        });
      }

      const data = await generationService.generate({
        styleId: styleId.trim(),
        image,
        aspectRatio: typeof aspectRatio === "string" ? aspectRatio : undefined,
        prompt: typeof prompt === "string" ? prompt : undefined,
      });

      res.json({ success: true, data });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Image generation failed";
      res.status(500).json({ success: false, message });
    }
  }

  /** Proxy Replicate CDN images so the mobile app can save to local gallery. */
  async fetchAsset(req: Request, res: Response) {
    const raw = req.query.url;
    const url = typeof raw === "string" ? raw.trim() : "";
    if (!url || !isAllowedRemoteImageUrl(url)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or disallowed image URL",
      });
    }

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(120_000),
        headers: { "User-Agent": "ConteX-Backend/1.0" },
      });
      if (!response.ok) {
        return res.status(502).json({
          success: false,
          message: `Upstream returned ${response.status}`,
        });
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length === 0) {
        return res.status(502).json({
          success: false,
          message: "Empty image response",
        });
      }

      const contentType =
        response.headers.get("content-type")?.split(";")[0]?.trim() ||
        "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "private, max-age=3600");
      res.send(buffer);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch image";
      res.status(502).json({ success: false, message });
    }
  }
}

export const generationController = new GenerationController();
