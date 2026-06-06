import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { encryptSecret, decryptSecret } from "../common/crypto.util.js";
import {
  ConnectionStatus,
  type SocialProvider,
} from "../generated/prisma/client.js";

export interface UpsertConnectionInput {
  organizationId: string;
  provider: SocialProvider;
  externalAccountId: string;
  accountName?: string | null;
  accessToken: string;
  refreshToken?: string | null;
  tokenExpiresAt?: Date | null;
  scopes?: string[];
  metadata?: Record<string, unknown> | null;
}

// A connection with its tokens decrypted, for internal use by analytics fetchers.
export interface DecryptedConnection {
  id: string;
  provider: SocialProvider;
  externalAccountId: string;
  accountName: string | null;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  metadata: Record<string, unknown>;
}

@Injectable()
export class SocialConnectionService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(input: UpsertConnectionInput) {
    const data = {
      organizationId: input.organizationId,
      provider: input.provider,
      externalAccountId: input.externalAccountId,
      accountName: input.accountName ?? null,
      accessTokenEnc: encryptSecret(input.accessToken),
      refreshTokenEnc: input.refreshToken
        ? encryptSecret(input.refreshToken)
        : null,
      tokenExpiresAt: input.tokenExpiresAt ?? null,
      scopes: input.scopes ?? [],
      metadata: (input.metadata ?? {}) as object,
      status: ConnectionStatus.ACTIVE,
    };

    return this.prisma.socialConnection.upsert({
      where: {
        organizationId_provider_externalAccountId: {
          organizationId: input.organizationId,
          provider: input.provider,
          externalAccountId: input.externalAccountId,
        },
      },
      create: data,
      update: data,
    });
  }

  // Public-facing list — never exposes tokens.
  async listForOrg(organizationId: string) {
    const rows = await this.prisma.socialConnection.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((r) => ({
      id: r.id,
      provider: r.provider,
      status: r.status,
      accountName: r.accountName,
      externalAccountId: r.externalAccountId,
      scopes: r.scopes,
      tokenExpiresAt: r.tokenExpiresAt,
      createdAt: r.createdAt,
      metadata: r.metadata,
    }));
  }

  async getDecryptedByProvider(
    organizationId: string,
    provider: SocialProvider,
  ): Promise<DecryptedConnection[]> {
    const rows = await this.prisma.socialConnection.findMany({
      where: { organizationId, provider, status: ConnectionStatus.ACTIVE },
    });
    return rows.map((r) => ({
      id: r.id,
      provider: r.provider,
      externalAccountId: r.externalAccountId,
      accountName: r.accountName,
      accessToken: decryptSecret(r.accessTokenEnc),
      refreshToken: r.refreshTokenEnc ? decryptSecret(r.refreshTokenEnc) : null,
      tokenExpiresAt: r.tokenExpiresAt,
      metadata: (r.metadata ?? {}) as Record<string, unknown>,
    }));
  }

  async remove(organizationId: string, id: string) {
    const conn = await this.prisma.socialConnection.findFirst({
      where: { id, organizationId },
    });
    if (!conn) throw new NotFoundException("Connection not found.");
    await this.prisma.socialConnection.delete({ where: { id } });
    return { success: true };
  }

  async markStatus(id: string, status: ConnectionStatus) {
    await this.prisma.socialConnection.update({
      where: { id },
      data: { status },
    });
  }

  async updateTokens(
    id: string,
    accessToken: string,
    tokenExpiresAt: Date | null,
  ) {
    await this.prisma.socialConnection.update({
      where: { id },
      data: {
        accessTokenEnc: encryptSecret(accessToken),
        tokenExpiresAt,
        status: ConnectionStatus.ACTIVE,
      },
    });
  }
}
