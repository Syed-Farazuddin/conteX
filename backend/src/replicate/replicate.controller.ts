import { Body, Controller, Get, Post } from "@nestjs/common";
import { ReplicateService } from "./replicate.service.js";

@Controller("replicate")
export class ReplicateController {
  constructor(private readonly replicateService: ReplicateService) {}

  @Get("status")
  status() {
    return this.replicateService.getStatus();
  }

  @Post("run")
  run(@Body() payload: { model: string; input: Record<string, unknown> }) {
    return this.replicateService.run(payload);
  }

  @Post("remove-background")
  removeBackground(@Body() payload: { imageUrl: string }) {
    return this.replicateService.removeBackground(payload);
  }
}
