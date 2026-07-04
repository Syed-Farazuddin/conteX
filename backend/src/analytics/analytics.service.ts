import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { SocialProvider } from "../generated/prisma/client.js";
import { MetaService } from "../integrations/meta.service.js";
import { GoogleService } from "../integrations/google.service.js";
import { SocialConnectionService } from "../integrations/social-connection.service.js";
import type { TrackEventDto } from "./dto/track-event.dto.js";

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly meta: MetaService,
    private readonly google: GoogleService,
    private readonly connections: SocialConnectionService,
  ) {}

  // ── Social audience analytics (Meta + Google) ─────────────────────────
  async getSocialOverview(orgId: string, days: number) {
    const [fbConns, igConns, gaConns] = await Promise.all([
      this.connections.getDecryptedByProvider(orgId, SocialProvider.FACEBOOK),
      this.connections.getDecryptedByProvider(orgId, SocialProvider.INSTAGRAM),
      this.connections.getDecryptedByProvider(
        orgId,
        SocialProvider.GOOGLE_ANALYTICS,
      ),
    ]);

    const [facebook, instagram, googleAnalytics] = await Promise.all([
      Promise.all(fbConns.map((c) => this.meta.fetchPageInsights(c, days))),
      Promise.all(
        igConns.map((c) => this.meta.fetchInstagramInsights(c, days)),
      ),
      Promise.all(gaConns.map((c) => this.google.fetchAnalytics(c, days))),
    ]);

    const followers =
      instagram.reduce((sum, a) => sum + (a.followers ?? 0), 0) +
      facebook.reduce((sum, a) => sum + (a.totals?.page_fans ?? 0), 0);

    const impressions =
      facebook.reduce((sum, a) => sum + (a.totals?.page_impressions ?? 0), 0) +
      instagram.reduce((sum, a) => sum + (a.totals?.impressions ?? 0), 0);

    const reach = instagram.reduce(
      (sum, a) => sum + (a.totals?.reach ?? 0),
      0,
    );

    const websiteUsers = googleAnalytics.reduce(
      (sum, a) => sum + (a.totals?.activeUsers ?? 0),
      0,
    );

    return {
      rangeDays: days,
      summary: { followers, impressions, reach, websiteUsers },
      connected: {
        facebook: fbConns.length,
        instagram: igConns.length,
        googleAnalytics: gaConns.length,
      },
      facebook,
      instagram,
      googleAnalytics,
    };
  }

  // ── Product usage analytics (our own event stream) ────────────────────
  async track(orgId: string, userId: string | null, dto: TrackEventDto) {
    await this.prisma.analyticsEvent.create({
      data: {
        organizationId: orgId,
        userId: userId ?? undefined,
        eventType: dto.eventType,
        path: dto.path,
        source: dto.source,
        sessionId: dto.sessionId,
        properties: (dto.properties ?? {}) as object,
      },
    });
    return { success: true };
  }

  async getProductOverview(orgId: string, days: number) {
    const since = new Date(Date.now() - days * 86400_000);
    const where = { organizationId: orgId, createdAt: { gte: since } };

    const [totalEvents, byType, topPaths, sessions, daily] = await Promise.all([
      this.prisma.analyticsEvent.count({ where }),
      this.prisma.analyticsEvent.groupBy({
        by: ["eventType"],
        where,
        _count: { _all: true },
        orderBy: { _count: { eventType: "desc" } },
      }),
      this.prisma.analyticsEvent.groupBy({
        by: ["path"],
        where: { ...where, path: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { path: "desc" } },
        take: 8,
      }),
      this.prisma.analyticsEvent.findMany({
        where: { ...where, sessionId: { not: null } },
        distinct: ["sessionId"],
        select: { sessionId: true },
      }),
      this.prisma.$queryRaw<Array<{ date: string; count: number }>>`
        SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS date,
               count(*)::int AS count
        FROM "AnalyticsEvent"
        WHERE "organizationId" = ${orgId} AND "createdAt" >= ${since}
        GROUP BY 1
        ORDER BY 1
      `,
    ]);

    return {
      rangeDays: days,
      summary: {
        totalEvents,
        uniqueSessions: sessions.length,
        eventTypes: byType.length,
      },
      byType: byType.map((b) => ({
        eventType: b.eventType,
        count: b._count._all,
      })),
      topPaths: topPaths.map((p) => ({
        path: p.path,
        count: p._count._all,
      })),
      daily,
    };
  }
}
