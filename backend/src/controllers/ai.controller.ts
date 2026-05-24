import type { Request, Response } from "express";
import { aiService } from "../services/ai.service.js";

export class AiController {
  status(_req: Request, res: Response) {
    res.json({
      configured: aiService.isConfigured(),
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
}

export const aiController = new AiController();
