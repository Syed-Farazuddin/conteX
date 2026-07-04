import { Body, Controller, Get, Post } from "@nestjs/common";
import { ClothingService } from "./clothing.service.js";

@Controller("clothing")
export class ClothingController {
  constructor(private readonly clothingService: ClothingService) {}

  @Get("status")
  status() {
    return this.clothingService.getStatus();
  }

  @Post("render")
  render(@Body() payload: { style: string; imageUrl: string }) {
    return this.clothingService.render(payload);
  }
}
