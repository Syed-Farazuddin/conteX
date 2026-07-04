import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { JwtPayload } from "../auth/auth.types.js";
import { MetaService } from "./meta.service.js";
import { GoogleService } from "./google.service.js";
import { OAuthStateService } from "./oauth-state.service.js";
import { SocialConnectionService } from "./social-connection.service.js";

@Controller("integrations")
export class IntegrationsController {
  constructor(
    private readonly meta: MetaService,
    private readonly google: GoogleService,
    private readonly state: OAuthStateService,
    private readonly connections: SocialConnectionService,
  ) {}

  // List connections + which providers are configured on the server.
  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@CurrentUser() user: JwtPayload) {
    const orgId = this.requireOrg(user);
    return {
      providers: {
        meta: this.meta.isConfigured(),
        google: this.google.isConfigured(),
      },
      connections: await this.connections.listForOrg(orgId),
    };
  }

  @Get("meta/connect")
  @UseGuards(JwtAuthGuard)
  async metaConnect(@CurrentUser() user: JwtPayload) {
    const orgId = this.requireOrg(user);
    if (!this.meta.isConfigured()) {
      throw new BadRequestException("Meta integration is not configured.");
    }
    const state = await this.state.sign({
      orgId,
      userId: user.sub,
      provider: "meta",
    });
    return { url: this.meta.buildAuthUrl(state) };
  }

  @Get("meta/callback")
  async metaCallback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Query("error") error: string,
    @Res() res: Response,
  ) {
    if (error || !code) return this.redirect(res, "meta", "denied");
    try {
      const { orgId } = await this.state.verify(state);
      const count = await this.meta.handleCallback(code, orgId);
      return this.redirect(res, "meta", "success", count);
    } catch {
      return this.redirect(res, "meta", "error");
    }
  }

  @Get("google/connect")
  @UseGuards(JwtAuthGuard)
  async googleConnect(@CurrentUser() user: JwtPayload) {
    const orgId = this.requireOrg(user);
    if (!this.google.isConfigured()) {
      throw new BadRequestException("Google integration is not configured.");
    }
    const state = await this.state.sign({
      orgId,
      userId: user.sub,
      provider: "google",
    });
    return { url: this.google.buildAuthUrl(state) };
  }

  @Get("google/callback")
  async googleCallback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Query("error") error: string,
    @Res() res: Response,
  ) {
    if (error || !code) return this.redirect(res, "google", "denied");
    try {
      const { orgId } = await this.state.verify(state);
      const count = await this.google.handleCallback(code, orgId);
      return this.redirect(res, "google", "success", count);
    } catch {
      return this.redirect(res, "google", "error");
    }
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  async remove(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    const orgId = this.requireOrg(user);
    return this.connections.remove(orgId, id);
  }

  private requireOrg(user: JwtPayload): string {
    if (!user.orgId) {
      throw new BadRequestException("No organization associated with this user.");
    }
    return user.orgId;
  }

  private redirect(
    res: Response,
    provider: string,
    status: string,
    count?: number,
  ) {
    const base = process.env.WEB_APP_URL ?? "http://localhost:3000";
    const params = new URLSearchParams({ connected: provider, status });
    if (typeof count === "number") params.set("count", String(count));
    res.redirect(`${base}/dashboard/connections?${params.toString()}`);
  }
}
