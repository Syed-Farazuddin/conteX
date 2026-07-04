import { Body, Controller, Get, Post } from "@nestjs/common";
import { AiService } from "./ai.service.js";
import { ChatDto } from "./dtos/chat.dto.js";
import { PlanPipelineDto } from "./dtos/plan-pipeline.dto.js";

@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get("status")
  status() {
    return this.aiService.getStatus();
  }

  @Post("chat")
  chat(@Body() body: ChatDto) {
    return this.aiService.chat(body);
  }

  @Post("plan-pipeline")
  planPipeline(@Body() body: PlanPipelineDto) {
    return this.aiService.planPipeline(body);
  }
}
