import { Module } from "@nestjs/common";
import { ReplicateController } from "./replicate.controller.js";
import { ReplicateService } from "./replicate.service.js";

@Module({
  controllers: [ReplicateController],
  providers: [ReplicateService],
})
export class ReplicateModule {}
