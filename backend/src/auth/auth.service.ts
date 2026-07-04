import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service.js";
import { Role } from "../generated/prisma/client.js";
import type { JwtPayload } from "./auth.types.js";
import type { LoginDto, SignupDto } from "./dto/auth.dto.js";

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<AuthTokens> {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException("An account with this email already exists.");
    }

    const slug = await this.generateUniqueSlug(dto.organizationName);
    const passwordHash = await hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        name: dto.name.trim(),
        passwordHash,
        role: Role.OWNER,
        organization: {
          create: {
            name: dto.organizationName.trim(),
            slug,
          },
        },
      },
    });

    return this.issueTokens({
      sub: user.id,
      email: user.email,
      orgId: user.organizationId,
      role: user.role,
    });
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    const ok = await compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    return this.issueTokens({
      sub: user.id,
      email: user.email,
      orgId: user.organizationId,
      role: user.role,
    });
  }

  // Rotating refresh: validates + revokes the presented token, issues a fresh pair.
  async refresh(rawToken: string): Promise<AuthTokens> {
    if (!rawToken) throw new UnauthorizedException("Missing refresh token.");

    const tokenHash = this.hashToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException("Session expired. Please sign in again.");
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens({
      sub: stored.user.id,
      email: stored.user.email,
      orgId: stored.user.organizationId,
      role: stored.user.role,
    });
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    const tokenHash = this.hashToken(rawToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });
    if (!user) throw new UnauthorizedException();

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organization: user.organization
        ? {
            id: user.organization.id,
            name: user.organization.name,
            slug: user.organization.slug,
          }
        : null,
    };
  }

  private async issueTokens(payload: JwtPayload): Promise<AuthTokens> {
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      // env value is a plain string; jsonwebtoken accepts ms-style strings at runtime.
      expiresIn: (process.env.JWT_ACCESS_TTL ?? "15m") as unknown as number,
    });

    const refreshToken = randomBytes(48).toString("base64url");
    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(refreshToken),
        userId: payload.sub,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(raw: string): string {
    return createHash("sha256").update(raw).digest("hex");
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
        .slice(0, 40) || "org";

    let slug = base;
    // Append a short suffix until we find a free slug.
    while (await this.prisma.organization.findUnique({ where: { slug } })) {
      slug = `${base}-${randomBytes(3).toString("hex")}`;
    }
    return slug;
  }
}
