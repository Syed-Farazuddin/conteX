import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { IntegrationsController } from "./integrations.controller.js";
import { MetaService } from "./meta.service.js";
import { GoogleService } from "./google.service.js";
import { OAuthStateService } from "./oauth-state.service.js";
import { SocialConnectionService } from "./social-connection.service.js";

@Module({
  imports: [AuthModule],
  controllers: [IntegrationsController],
  providers: [
    MetaService,
    GoogleService,
    OAuthStateService,
    SocialConnectionService,
  ],
  exports: [
    MetaService,
    GoogleService,
    SocialConnectionService,
  ],
})
export class IntegrationsModule {}
