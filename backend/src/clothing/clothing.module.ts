import { Module } from "@nestjs/common";
import { ClothingController } from "./clothing.controller.js";
import { ClothingService } from "./clothing.service.js";

@Module({
  controllers: [ClothingController],
  providers: [ClothingService],
})
export class ClothingModule {}
