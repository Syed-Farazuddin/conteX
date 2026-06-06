import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { IntegrationsModule } from "./integrations/integrations.module.js";
import { AnalyticsModule } from "./analytics/analytics.module.js";
import { AiModule } from "./ai/ai.module.js";
import { ClothingModule } from "./clothing/clothing.module.js";
import { GenerationModule } from "./generation/generation.module.js";
import { ReplicateModule } from "./replicate/replicate.module.js";
import { UploadModule } from "./upload/upload.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    IntegrationsModule,
    AnalyticsModule,
    AiModule,
    ClothingModule,
    GenerationModule,
    ReplicateModule,
    UploadModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
