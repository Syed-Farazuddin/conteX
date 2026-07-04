export interface SeriesPoint {
  date: string;
  value: number;
}

export interface AccountInsights {
  connectionId: string;
  provider: string;
  accountName: string | null;
  totals: Record<string, number>;
  series: Record<string, SeriesPoint[]>;
  followers?: number;
  mediaCount?: number;
  error?: string;
}

export interface SocialOverview {
  rangeDays: number;
  summary: {
    followers: number;
    impressions: number;
    reach: number;
    websiteUsers: number;
  };
  connected: { facebook: number; instagram: number; googleAnalytics: number };
  facebook: AccountInsights[];
  instagram: AccountInsights[];
  googleAnalytics: AccountInsights[];
}

export interface ProductOverview {
  rangeDays: number;
  summary: {
    totalEvents: number;
    uniqueSessions: number;
    eventTypes: number;
  };
  byType: Array<{ eventType: string; count: number }>;
  topPaths: Array<{ path: string | null; count: number }>;
  daily: Array<{ date: string; count: number }>;
}

export interface SocialConnection {
  id: string;
  provider: "FACEBOOK" | "INSTAGRAM" | "GOOGLE_ANALYTICS";
  status: string;
  accountName: string | null;
  externalAccountId: string;
  scopes: string[];
  tokenExpiresAt: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

export interface ConnectionsResponse {
  providers: { meta: boolean; google: boolean };
  connections: SocialConnection[];
}
