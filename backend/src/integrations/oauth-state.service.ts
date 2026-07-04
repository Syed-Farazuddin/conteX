import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

export interface OAuthState {
  orgId: string;
  userId: string;
  provider: string;
}

// Signs/verifies the short-lived `state` parameter carried through the OAuth
// redirect (the provider callback is a browser redirect, not an authed XHR, so
// we can't use the normal JwtAuthGuard there).
@Injectable()
export class OAuthStateService {
  constructor(private readonly jwt: JwtService) {}

  async sign(state: OAuthState): Promise<string> {
    return this.jwt.signAsync(state, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: 600 as unknown as number, // 10 minutes
    });
  }

  async verify(token: string): Promise<OAuthState> {
    try {
      return await this.jwt.verifyAsync<OAuthState>(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
    } catch {
      throw new UnauthorizedException("Invalid or expired OAuth state.");
    }
  }
}
