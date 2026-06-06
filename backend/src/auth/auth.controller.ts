import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService, type AuthTokens } from "./auth.service.js";
import { LoginDto, RefreshDto, SignupDto } from "./dto/auth.dto.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";
import { CurrentUser } from "./current-user.decorator.js";
import type { JwtPayload } from "./auth.types.js";

const REFRESH_COOKIE = "contex_rt";
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  async signup(@Body() dto: SignupDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.signup(dto);
    return this.respondWithTokens(res, tokens);
  }

  @Post("login")
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.login(dto);
    return this.respondWithTokens(res, tokens);
  }

  @Post("refresh")
  @HttpCode(200)
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = this.readRefreshToken(req, dto);
    const tokens = await this.authService.refresh(raw);
    return this.respondWithTokens(res, tokens);
  }

  @Post("logout")
  @HttpCode(200)
  async logout(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(this.readRefreshToken(req, dto));
    this.clearRefreshCookie(res);
    return { success: true };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: JwtPayload) {
    return this.authService.me(user.sub);
  }

  private readRefreshToken(req: Request, dto: RefreshDto): string {
    const cookies = (req as Request & { cookies?: Record<string, string> })
      .cookies;
    return dto.refreshToken ?? cookies?.[REFRESH_COOKIE] ?? "";
  }

  // Sets the refresh token as an httpOnly cookie (web) and also returns both
  // tokens in the body (mobile / non-cookie clients).
  private respondWithTokens(res: Response, tokens: AuthTokens) {
    const isProd = process.env.NODE_ENV === "production";
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/api/auth",
      maxAge: REFRESH_COOKIE_MAX_AGE,
    });
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  }
}
