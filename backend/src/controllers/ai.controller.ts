import type { Request, Response } from "express";
import { config } from "../config/index.js";
import { aiService } from "../services/ai.service.js";
import { backgroundSearchService } from "../services/background-search.service.js";
import { pipelineService } from "../services/pipeline.service.js";

export class AiController {
  status(_req: Request, res: Response) {
    res.json({
      configured: aiService.isConfigured(),
      pipeline: {
        mode: config.useMockPipeline ? "mock" : "openai",
      },
      backgroundSearch: {
        configured: backgroundSearchService.isConfigured(),
        providers: backgroundSearchService.getConfiguredProviders(),
      },
    });
  }

  async chat(req: Request, res: Response) {
    try {
      const { prompt, messages, model, temperature, maxTokens } = req.body ?? {};

      if (messages?.length) {
        const reply = await aiService.chat(messages, {
          model,
          temperature,
          maxTokens,
        });
        return res.json({ success: true, data: { reply } });
      }

      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({
          success: false,
          message: "Provide `prompt` or `messages`",
        });
      }

      const reply = await aiService.complete(prompt, {
        model,
        temperature,
        maxTokens,
      });

      res.json({ success: true, data: { reply } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI request failed";
      res.status(500).json({ success: false, message });
    }
  }

  async planPipeline(req: Request, res: Response) {
    try {
      const { imageBase64 } = req.body ?? {};

      if (!imageBase64 || typeof imageBase64 !== "string") {
        return res.status(400).json({
          success: false,
          message: "Provide `imageBase64` (data URL or raw base64 string)",
        });
      }

      const result = await pipelineService.planFromImageBase64(imageBase64);
      res.json({
        success: true,
        data: result.plan,
        meta: {
          pipelineSource: result.source,
          planId: result.planId,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Pipeline planning failed";
      res.status(500).json({ success: false, message });
    }
  }
}

export const aiController = new AiController();
