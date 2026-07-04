"use client";

import { useState } from "react";
import Link from "next/link";
import { useApiData } from "@/lib/hooks/use-api";
import type { AccountInsights, SocialOverview } from "@/lib/analytics/types";
import { PageHeader, RangeSelector } from "@/components/dashboard/controls";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendChart } from "@/components/dashboard/charts";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Spinner,
} from "@/components/ui/ui";

export default function SocialPage() {
  const [days, setDays] = useState(30);
  const { data, loading, error } = useApiData<SocialOverview>(
    `/api/analytics/social?days=${days}`,
  );

  const totalAccounts = data
    ? data.connected.facebook +
      data.connected.instagram +
      data.connected.googleAnalytics
    : 0;

  return (
    <div>
      <PageHeader
        title="Social Analytics"
        description="Audience, reach and engagement across your connected platforms."
        actions={<RangeSelector value={days} onChange={setDays} />}
      />

      {loading ? (
        <div className="flex justify-center py-16 text-zinc-400">
          <Spinner className="size-6" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : !data ? null : totalAccounts === 0 ? (
        <EmptyState
          title="No social accounts connected"
          description="Connect Facebook, Instagram or Google Analytics to see your audience analytics here."
          action={
            <Link href="/dashboard/connections">
              <Button size="sm">Go to Connections</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Followers" value={data.summary.followers} />
            <StatCard label="Impressions" value={data.summary.impressions} />
            <StatCard label="Reach" value={data.summary.reach} />
            <StatCard
              label="Website users"
              value={data.summary.websiteUsers}
            />
          </div>

          <AccountGroup
            title="Instagram"
            accounts={data.instagram}
            primaryMetric="reach"
            metricLabel="Reach"
            color="#ec4899"
          />
          <AccountGroup
            title="Facebook Pages"
            accounts={data.facebook}
            primaryMetric="page_impressions"
            metricLabel="Impressions"
            color="#3b82f6"
          />
          <AccountGroup
            title="Google Analytics"
            accounts={data.googleAnalytics}
            primaryMetric="activeUsers"
            metricLabel="Active users"
            color="#f59e0b"
          />
        </div>
      )}
    </div>
  );
}

function AccountGroup({
  title,
  accounts,
  primaryMetric,
  metricLabel,
  color,
}: {
  title: string;
  accounts: AccountInsights[];
  primaryMetric: string;
  metricLabel: string;
  color: string;
}) {
  if (!accounts || accounts.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-zinc-100">{title}</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {accounts.map((acc) => (
          <Card key={acc.connectionId} className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-100">
                  {acc.accountName ?? "Account"}
                </p>
                {typeof acc.followers === "number" && acc.followers > 0 ? (
                  <p className="text-xs text-zinc-500">
                    {acc.followers.toLocaleString()} followers
                  </p>
                ) : null}
              </div>
              {acc.error ? <Badge tone="danger">No data</Badge> : null}
            </div>

            {acc.error ? (
              <p className="text-sm text-zinc-500">{acc.error}</p>
            ) : (
              <>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {metricLabel}
                </p>
                <TrendChart
                  data={acc.series[primaryMetric] ?? []}
                  color={color}
                  height={180}
                />
              </>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}
