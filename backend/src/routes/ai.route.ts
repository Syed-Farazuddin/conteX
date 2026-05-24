import { Router } from "express";
import { aiController } from "../controllers/ai.controller.js";

export const aiRouter = Router();

aiRouter.get("/status", (req, res) => aiController.status(req, res));
aiRouter.post("/chat", (req, res) => aiController.chat(req, res));
aiRouter.post("/plan-pipeline", (req, res) =>
  aiController.planPipeline(req, res),
);
