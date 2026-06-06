import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class GenerationService {
  constructor(private readonly prisma: PrismaService) {}

  listStyles() {
    return [
      "studio-ghibli",
      "cinematic",
      "anime",
      "polaroid",
      "digital-art",
      "vaporwave",
    ];
  }

  async createGeneration(payload: { prompt: string; style: string; userEmail?: string }) {
    let userId = undefined;

    if (payload.userEmail) {
      const user = await this.prisma.user.upsert({
        where: { email: payload.userEmail },
        update: {},
        create: { email: payload.userEmail },
      });
      userId = user.id;
    }

    return this.prisma.generation.create({
      data: {
        prompt: payload.prompt,
        style: payload.style,
        imageUrl: null,
        userId,
      },
    });
  }

  async fetchAsset(id: string) {
    if (!id) {
      return { error: "Asset id not provided" };
    }

    const generation = await this.prisma.generation.findUnique({
      where: { id },
    });

    if (!generation) {
      return { error: "Asset not found" };
    }

    return {
      id: generation.id,
      prompt: generation.prompt,
      style: generation.style,
      imageUrl: generation.imageUrl || null,
    };
  }
}
