"use client";

import { useState } from "react";
import { useApiData } from "@/lib/hooks/use-api";
import type { ProductOverview } from "@/lib/analytics/types";
import { PageHeader, RangeSelector } from "@/components/dashboard/controls";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendChart, BarSeries } from "@/components/dashboard/charts";
import { Card, EmptyState, Spinner } from "@/components/ui/ui";

export default function ProductPage() {
  const [days, setDays] = useState(30);
  const { data, loading, error } = useApiData<ProductOverview>(
    `/api/analytics/product?days=${days}`,
  );

  return (
    <div>
      <PageHeader
        title="Product Usage"
        description="What your team and users are doing inside ConteX (web & app)."
        actions={<RangeSelector value={days} onChange={setDays} />}
      />

      {loading ? (
        <Loading />
      ) : error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : !data ? null : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total events" value={data.summary.totalEvents} />
            <StatCard
              label="Unique sessions"
              value={data.summary.uniqueSessions}
            />
            <StatCard label="Event types" value={data.summary.eventTypes} />
          </div>

          {data.summary.totalEvents === 0 ? (
            <EmptyState
              title="No activity recorded yet"
              description="As people use the web app and mobile app, their actions appear here automatically."
            />
          ) : (
            <>
              <Card className="p-5">
                <h3 className="mb-4 text-sm font-medium text-zinc-300">
                  Events over time
                </h3>
                <TrendChart
                  data={data.daily.map((d) => ({
                    date: d.date,
                    value: d.count,
                  }))}
                />
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="p-5">
                  <h3 className="mb-4 text-sm font-medium text-zinc-300">
                    Top event types
                  </h3>
                  <BarSeries
                    data={data.byType.slice(0, 6).map((b) => ({
                      label: b.eventType,
                      value: b.count,
                    }))}
                  />
                </Card>

                <Card className="p-5">
                  <h3 className="mb-4 text-sm font-medium text-zinc-300">
                    Top pages / screens
                  </h3>
                  <div className="space-y-2">
                    {data.topPaths.length === 0 ? (
                      <p className="text-sm text-zinc-500">No page data yet.</p>
                    ) : (
                      data.topPaths.map((p) => (
                        <div
                          key={p.path ?? "unknown"}
                          className="flex items-center justify-between border-b border-white/5 pb-2 text-sm last:border-0"
                        >
                          <span className="truncate text-zinc-300">
                            {p.path ?? "—"}
                          </span>
                          <span className="font-medium text-zinc-100">
                            {p.count}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex justify-center py-16 text-zinc-400">
      <Spinner className="size-6" />
    </div>
  );
}
