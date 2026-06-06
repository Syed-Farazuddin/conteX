import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { IntegrationsModule } from "../integrations/integrations.module.js";
import { AnalyticsController } from "./analytics.controller.js";
import { AnalyticsService } from "./analytics.service.js";

@Module({
  imports: [AuthModule, IntegrationsModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
