"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { useApiData } from "@/lib/hooks/use-api";
import type {
  ProductOverview,
  SocialOverview,
} from "@/lib/analytics/types";
import { PageHeader } from "@/components/dashboard/controls";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendChart } from "@/components/dashboard/charts";
import { Button, Card, Spinner } from "@/components/ui/ui";

export default function OverviewPage() {
  const { user } = useAuth();
  const social = useApiData<SocialOverview>("/api/analytics/social?days=30");
  const product = useApiData<ProductOverview>(
    "/api/analytics/product?days=30",
  );

  const loading = social.loading || product.loading;
  const totalAccounts = social.data
    ? social.data.connected.facebook +
      social.data.connected.instagram +
      social.data.connected.googleAnalytics
    : 0;

  return (
    <div>
      <PageHeader
        title={`Welcome${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        description="A snapshot of your social audience and product activity over the last 30 days."
      />

      {loading ? (
        <div className="flex justify-center py-16 text-zinc-400">
          <Spinner className="size-6" />
        </div>
      ) : (
        <div className="space-y-6">
          {totalAccounts === 0 ? (
            <Card className="flex flex-wrap items-center justify-between gap-4 border-violet-400/20 bg-violet-500/10 p-5">
              <div>
                <p className="font-medium text-zinc-50">
                  Connect your first platform
                </p>
                <p className="text-sm text-zinc-300">
                  Link Facebook, Instagram or Google Analytics to unlock your
                  social dashboard.
                </p>
              </div>
              <Link href="/dashboard/connections">
                <Button size="sm">Connect now</Button>
              </Link>
            </Card>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Followers"
              value={social.data?.summary.followers ?? 0}
            />
            <StatCard
              label="Impressions"
              value={social.data?.summary.impressions ?? 0}
            />
            <StatCard
              label="Website users"
              value={social.data?.summary.websiteUsers ?? 0}
            />
            <StatCard
              label="Product events"
              value={product.data?.summary.totalEvents ?? 0}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">
                  Product activity
                </h3>
                <Link
                  href="/dashboard/product"
                  className="text-xs font-medium text-violet-300 hover:text-violet-200"
                >
                  View all
                </Link>
              </div>
              <TrendChart
                data={(product.data?.daily ?? []).map((d) => ({
                  date: d.date,
                  value: d.count,
                }))}
              />
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">
                  Instagram reach
                </h3>
                <Link
                  href="/dashboard/social"
                  className="text-xs font-medium text-violet-300 hover:text-violet-200"
                >
                  View all
                </Link>
              </div>
              <TrendChart
                data={social.data?.instagram?.[0]?.series?.reach ?? []}
                color="#ec4899"
              />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
