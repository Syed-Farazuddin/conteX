import { Router } from "express";
import { replicateController } from "../controllers/replicate.controller.js";

export const replicateRouter = Router();

replicateRouter.get("/status", (req, res) =>
  replicateController.status(req, res),
);
replicateRouter.post("/run", (req, res) => replicateController.run(req, res));
replicateRouter.post("/remove-background", (req, res) =>
  replicateController.removeBackground(req, res),
);
