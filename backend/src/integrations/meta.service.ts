import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { SocialProvider } from "../generated/prisma/client.js";
import {
  SocialConnectionService,
  type DecryptedConnection,
} from "./social-connection.service.js";

const META_SCOPES = [
  "public_profile",
  "email",
  "pages_show_list",
  "pages_read_engagement",
  "read_insights",
  "instagram_basic",
  "instagram_manage_insights",
  "business_management",
];

interface FbPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: { id: string; username?: string };
}

@Injectable()
export class MetaService {
  private readonly logger = new Logger(MetaService.name);

  constructor(private readonly connections: SocialConnectionService) {}

  private get version() {
    return process.env.META_GRAPH_VERSION ?? "v21.0";
  }

  private get graphBase() {
    return `https://graph.facebook.com/${this.version}`;
  }

  isConfigured(): boolean {
    return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
  }

  buildAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: process.env.META_APP_ID ?? "",
      redirect_uri: process.env.META_REDIRECT_URI ?? "",
      state,
      scope: META_SCOPES.join(","),
      response_type: "code",
    });
    return `https://www.facebook.com/${this.version}/dialog/oauth?${params.toString()}`;
  }

  // Exchanges the auth code, upgrades to a long-lived token, then stores one
  // connection per Facebook Page and per linked Instagram Business account.
  async handleCallback(code: string, organizationId: string): Promise<number> {
    const shortLived = await this.exchangeCode(code);
    const longLived = await this.exchangeForLongLivedToken(shortLived);

    const pages = await this.fetchPages(longLived.accessToken);
    const expiresAt = longLived.expiresIn
      ? new Date(Date.now() + longLived.expiresIn * 1000)
      : null;

    let stored = 0;
    for (const page of pages) {
      await this.connections.upsert({
        organizationId,
        provider: SocialProvider.FACEBOOK,
        externalAccountId: page.id,
        accountName: page.name,
        accessToken: page.access_token,
        tokenExpiresAt: expiresAt,
        scopes: META_SCOPES,
        metadata: { pageId: page.id },
      });
      stored++;

      if (page.instagram_business_account?.id) {
        await this.connections.upsert({
          organizationId,
          provider: SocialProvider.INSTAGRAM,
          externalAccountId: page.instagram_business_account.id,
          accountName:
            page.instagram_business_account.username ?? page.name,
          // IG insights are queried with the Page access token.
          accessToken: page.access_token,
          tokenExpiresAt: expiresAt,
          scopes: META_SCOPES,
          metadata: {
            pageId: page.id,
            igUserId: page.instagram_business_account.id,
          },
        });
        stored++;
      }
    }

    return stored;
  }

  private async exchangeCode(code: string) {
    const { data } = await axios.get(`${this.graphBase}/oauth/access_token`, {
      params: {
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        redirect_uri: process.env.META_REDIRECT_URI,
        code,
      },
    });
    return data.access_token as string;
  }

  private async exchangeForLongLivedToken(shortLivedToken: string) {
    const { data } = await axios.get(`${this.graphBase}/oauth/access_token`, {
      params: {
        grant_type: "fb_exchange_token",
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        fb_exchange_token: shortLivedToken,
      },
    });
    return {
      accessToken: data.access_token as string,
      expiresIn: (data.expires_in as number | undefined) ?? null,
    };
  }

  private async fetchPages(userAccessToken: string): Promise<FbPage[]> {
    const { data } = await axios.get(`${this.graphBase}/me/accounts`, {
      params: {
        fields:
          "id,name,access_token,instagram_business_account{id,username}",
        access_token: userAccessToken,
        limit: 100,
      },
    });
    return (data.data as FbPage[]) ?? [];
  }

  // ── Insights ──────────────────────────────────────────────────────────

  async fetchPageInsights(conn: DecryptedConnection, days: number) {
    const metrics = [
      "page_impressions",
      "page_post_engagements",
      "page_fans",
    ];
    try {
      const { data } = await axios.get(
        `${this.graphBase}/${conn.externalAccountId}/insights`,
        {
          params: {
            metric: metrics.join(","),
            period: "day",
            since: this.sinceUnix(days),
            until: this.nowUnix(),
            access_token: conn.accessToken,
          },
        },
      );
      return this.normalizeInsights(conn, data.data ?? []);
    } catch (err) {
      this.logFetchError("page", conn, err);
      return this.emptyInsights(conn);
    }
  }

  async fetchInstagramInsights(conn: DecryptedConnection, days: number) {
    const igUserId =
      (conn.metadata.igUserId as string | undefined) ??
      conn.externalAccountId;
    try {
      const [insights, profile] = await Promise.all([
        axios.get(`${this.graphBase}/${igUserId}/insights`, {
          params: {
            metric: "impressions,reach,profile_views",
            period: "day",
            since: this.sinceUnix(days),
            until: this.nowUnix(),
            access_token: conn.accessToken,
          },
        }),
        axios.get(`${this.graphBase}/${igUserId}`, {
          params: {
            fields: "followers_count,media_count,username",
            access_token: conn.accessToken,
          },
        }),
      ]);

      const normalized = this.normalizeInsights(conn, insights.data.data ?? []);
      normalized.followers = (profile.data.followers_count as number) ?? 0;
      normalized.mediaCount = (profile.data.media_count as number) ?? 0;
      return normalized;
    } catch (err) {
      this.logFetchError("instagram", conn, err);
      return this.emptyInsights(conn);
    }
  }

  private normalizeInsights(
    conn: DecryptedConnection,
    raw: Array<{ name: string; values: Array<{ value: number; end_time?: string }> }>,
  ) {
    const series: Record<string, Array<{ date: string; value: number }>> = {};
    const totals: Record<string, number> = {};

    for (const metric of raw) {
      const points = (metric.values ?? []).map((v) => ({
        date: v.end_time ? v.end_time.slice(0, 10) : "",
        value: typeof v.value === "number" ? v.value : 0,
      }));
      series[metric.name] = points;
      totals[metric.name] = points.reduce((sum, p) => sum + p.value, 0);
    }

    return {
      connectionId: conn.id,
      provider: conn.provider,
      accountName: conn.accountName,
      totals,
      series,
      followers: 0,
      mediaCount: 0,
    };
  }

  private emptyInsights(conn: DecryptedConnection) {
    return {
      connectionId: conn.id,
      provider: conn.provider,
      accountName: conn.accountName,
      totals: {} as Record<string, number>,
      series: {} as Record<string, Array<{ date: string; value: number }>>,
      followers: 0,
      mediaCount: 0,
      error: "Could not load insights for this account.",
    };
  }

  private sinceUnix(days: number): number {
    return Math.floor((Date.now() - days * 86400_000) / 1000);
  }

  private nowUnix(): number {
    return Math.floor(Date.now() / 1000);
  }

  private logFetchError(kind: string, conn: DecryptedConnection, err: unknown) {
    const detail = axios.isAxiosError(err)
      ? JSON.stringify(err.response?.data ?? err.message)
      : String(err);
    this.logger.warn(
      `Meta ${kind} insights failed for ${conn.accountName ?? conn.externalAccountId}: ${detail}`,
    );
  }
}
