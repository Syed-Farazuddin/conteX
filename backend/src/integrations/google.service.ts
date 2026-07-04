import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { SocialProvider } from "../generated/prisma/client.js";
import {
  SocialConnectionService,
  type DecryptedConnection,
} from "./social-connection.service.js";

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/analytics.readonly",
];

@Injectable()
export class GoogleService {
  private readonly logger = new Logger(GoogleService.name);

  constructor(private readonly connections: SocialConnectionService) {}

  isConfigured(): boolean {
    return Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
    );
  }

  buildAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? "",
      response_type: "code",
      scope: GOOGLE_SCOPES.join(" "),
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Exchanges the code, then stores one connection per GA4 property the user
  // can access.
  async handleCallback(code: string, organizationId: string): Promise<number> {
    const tokens = await this.exchangeCode(code);
    const properties = await this.listProperties(tokens.accessToken);
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

    let stored = 0;
    for (const prop of properties) {
      await this.connections.upsert({
        organizationId,
        provider: SocialProvider.GOOGLE_ANALYTICS,
        externalAccountId: prop.propertyId,
        accountName: prop.displayName,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: expiresAt,
        scopes: GOOGLE_SCOPES,
        metadata: {
          propertyId: prop.propertyId,
          account: prop.accountName,
        },
      });
      stored++;
    }
    return stored;
  }

  private async exchangeCode(code: string) {
    const { data } = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? "",
        grant_type: "authorization_code",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );
    return {
      accessToken: data.access_token as string,
      refreshToken: (data.refresh_token as string | undefined) ?? null,
      expiresIn: (data.expires_in as number | undefined) ?? 3600,
    };
  }

  private async listProperties(accessToken: string) {
    const { data } = await axios.get(
      "https://analyticsadmin.googleapis.com/v1beta/accountSummaries",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    const out: Array<{
      propertyId: string;
      displayName: string;
      accountName: string;
    }> = [];

    for (const account of data.accountSummaries ?? []) {
      for (const prop of account.propertySummaries ?? []) {
        // prop.property looks like "properties/123456789"
        const propertyId = String(prop.property ?? "").split("/")[1] ?? "";
        if (propertyId) {
          out.push({
            propertyId,
            displayName: prop.displayName ?? `Property ${propertyId}`,
            accountName: account.displayName ?? "",
          });
        }
      }
    }
    return out;
  }

  // Returns a valid access token, refreshing via the stored refresh token when
  // the current one has expired.
  private async getValidAccessToken(
    conn: DecryptedConnection,
  ): Promise<string> {
    const stillValid =
      conn.tokenExpiresAt && conn.tokenExpiresAt.getTime() - 60_000 > Date.now();
    if (stillValid) return conn.accessToken;
    if (!conn.refreshToken) return conn.accessToken;

    const { data } = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        refresh_token: conn.refreshToken,
        grant_type: "refresh_token",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );

    const accessToken = data.access_token as string;
    const expiresAt = new Date(
      Date.now() + ((data.expires_in as number | undefined) ?? 3600) * 1000,
    );
    await this.connections.updateTokens(conn.id, accessToken, expiresAt);
    return accessToken;
  }

  // Runs a GA4 report: daily active users + sessions + screen/page views.
  async fetchAnalytics(conn: DecryptedConnection, days: number) {
    try {
      const accessToken = await this.getValidAccessToken(conn);
      const propertyId =
        (conn.metadata.propertyId as string | undefined) ??
        conn.externalAccountId;

      const { data } = await axios.post(
        `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
        {
          dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
          dimensions: [{ name: "date" }],
          metrics: [
            { name: "activeUsers" },
            { name: "sessions" },
            { name: "screenPageViews" },
          ],
          orderBys: [{ dimension: { dimensionName: "date" } }],
        },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      return this.normalizeReport(conn, data);
    } catch (err) {
      const detail = axios.isAxiosError(err)
        ? JSON.stringify(err.response?.data ?? err.message)
        : String(err);
      this.logger.warn(
        `GA4 report failed for ${conn.accountName ?? conn.externalAccountId}: ${detail}`,
      );
      return {
        connectionId: conn.id,
        provider: conn.provider,
        accountName: conn.accountName,
        totals: {} as Record<string, number>,
        series: { activeUsers: [], sessions: [], screenPageViews: [] } as Record<
          string,
          Array<{ date: string; value: number }>
        >,
        error: "Could not load analytics for this property.",
      };
    }
  }

  private normalizeReport(conn: DecryptedConnection, data: any) {
    const series: Record<string, Array<{ date: string; value: number }>> = {
      activeUsers: [],
      sessions: [],
      screenPageViews: [],
    };
    const totals: Record<string, number> = {
      activeUsers: 0,
      sessions: 0,
      screenPageViews: 0,
    };
    const metricNames = ["activeUsers", "sessions", "screenPageViews"];

    for (const row of data.rows ?? []) {
      const rawDate = row.dimensionValues?.[0]?.value ?? ""; // YYYYMMDD
      const date =
        rawDate.length === 8
          ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
          : rawDate;
      metricNames.forEach((name, i) => {
        const value = Number(row.metricValues?.[i]?.value ?? 0);
        series[name].push({ date, value });
        totals[name] += value;
      });
    }

    return {
      connectionId: conn.id,
      provider: conn.provider,
      accountName: conn.accountName,
      totals,
      series,
    };
  }
}
