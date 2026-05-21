import type { Request, Response } from "express";
import { uploadService } from "../services/upload.service.js";

export class UploadController {
  async receive(req: Request, res: Response) {
    // TODO: wire multer / multipart parser
    const { filename = "unknown", mimetype = "image/*", size = 0 } =
      req.body ?? {};

    const result = await uploadService.processUpload({
      filename,
      mimetype,
      size,
    });

    res.json({
      success: true,
      data: result,
      message: "Photo received",
    });
  }
}

export const uploadController = new UploadController();
