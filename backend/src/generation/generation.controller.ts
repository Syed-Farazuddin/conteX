import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { GenerationService } from "./generation.service.js";
import { CreateGenerationDto } from "./dtos/create-generation.dto.js";

@Controller("generate")
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  @Get("styles")
  listStyles() {
    return this.generationService.listStyles();
  }

  @Post()
  create(@Body() payload: CreateGenerationDto) {
    return this.generationService.createGeneration(payload);
  }

  @Get("asset")
  async fetchAsset(@Query("id") id: string) {
    return this.generationService.fetchAsset(id);
  }
}
