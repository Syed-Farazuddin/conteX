import { Router } from "express";
import { clothingController } from "../controllers/clothing.controller.js";

export const clothingRouter = Router();

clothingRouter.get("/status", (req, res) =>
  clothingController.status(req, res),
);
clothingRouter.post("/render", (req, res) =>
  clothingController.render(req, res),
);
