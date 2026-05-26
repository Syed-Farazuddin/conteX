import { Router } from "express";
import { generationController } from "../controllers/generation.controller.js";

export const generationRouter = Router();

generationRouter.get("/styles", (req, res) =>
  generationController.listStyles(req, res),
);
generationRouter.post("/", (req, res) =>
  generationController.generate(req, res),
);
generationRouter.get("/asset", (req, res) =>
  generationController.fetchAsset(req, res),
);
