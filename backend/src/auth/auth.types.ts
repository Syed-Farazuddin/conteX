import type { Role } from "../generated/prisma/client.js";

// Decoded access-token payload, attached to req.user by JwtAuthGuard.
export interface JwtPayload {
  sub: string; // user id
  email: string;
  orgId: string | null;
  role: Role;
}

export interface AuthedRequest {
  user: JwtPayload;
}
