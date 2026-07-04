import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class UploadService {
  constructor(private readonly prisma: PrismaService) {}

  async createUpload(payload: { filename: string; url: string }) {
    return this.prisma.upload.create({
      data: {
        filename: payload.filename,
        url: payload.url,
      },
    });
  }
}
