import { Router } from "express";
import { uploadController } from "../controllers/upload.controller.js";

export const uploadRouter = Router();

uploadRouter.post("/", (req, res) => uploadController.receive(req, res));
