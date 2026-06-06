import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { JwtPayload } from "../auth/auth.types.js";
import { AnalyticsService } from "./analytics.service.js";
import { TrackEventDto } from "./dto/track-event.dto.js";

@Controller("analytics")
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get("social")
  async social(
    @CurrentUser() user: JwtPayload,
    @Query("days") days?: string,
  ) {
    return this.analytics.getSocialOverview(
      this.requireOrg(user),
      this.parseDays(days),
    );
  }

  @Get("product")
  async product(
    @CurrentUser() user: JwtPayload,
    @Query("days") days?: string,
  ) {
    return this.analytics.getProductOverview(
      this.requireOrg(user),
      this.parseDays(days),
    );
  }

  @Post("track")
  async track(@CurrentUser() user: JwtPayload, @Body() dto: TrackEventDto) {
    return this.analytics.track(this.requireOrg(user), user.sub, dto);
  }

  private requireOrg(user: JwtPayload): string {
    if (!user.orgId) {
      throw new BadRequestException("No organization associated with this user.");
    }
    return user.orgId;
  }

  private parseDays(days?: string): number {
    const n = Number(days);
    if (!Number.isFinite(n) || n <= 0) return 30;
    return Math.min(Math.floor(n), 365);
  }
}
