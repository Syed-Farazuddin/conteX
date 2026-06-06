"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useApiData } from "@/lib/hooks/use-api";
import type { ConnectionsResponse, SocialConnection } from "@/lib/analytics/types";
import { PageHeader } from "@/components/dashboard/controls";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Spinner,
} from "@/components/ui/ui";

const PROVIDER_LABEL: Record<string, string> = {
  FACEBOOK: "Facebook Page",
  INSTAGRAM: "Instagram",
  GOOGLE_ANALYTICS: "Google Analytics",
};

function statusTone(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "EXPIRED") return "warning" as const;
  return "danger" as const;
}

export default function ConnectionsPage() {
  const { authFetch } = useAuth();
  const { data, loading, error, reload } =
    useApiData<ConnectionsResponse>("/api/integrations");
  const [connecting, setConnecting] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Surface the result of an OAuth round-trip (?connected=meta&status=success).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const provider = params.get("connected");
    const status = params.get("status");
    const count = params.get("count");
    if (!provider) return;
    if (status === "success") {
      setNotice(
        `Connected ${provider === "meta" ? "Meta" : "Google"} successfully${
          count ? ` — ${count} account(s) linked.` : "."
        }`,
      );
    } else if (status === "denied") {
      setNotice("Authorization was cancelled.");
    } else {
      setNotice("Something went wrong while connecting. Please try again.");
    }
  }, []);

  async function connect(provider: "meta" | "google") {
    setConnecting(provider);
    try {
      const { url } = await authFetch<{ url: string }>(
        `/api/integrations/${provider}/connect`,
      );
      window.location.href = url;
    } catch {
      setNotice("Could not start the connection. Is the provider configured?");
      setConnecting(null);
    }
  }

  async function disconnect(id: string) {
    await authFetch(`/api/integrations/${id}`, { method: "DELETE" });
    await reload();
  }

  const grouped = useMemo(() => {
    const map: Record<string, SocialConnection[]> = {};
    for (const c of data?.connections ?? []) {
      (map[c.provider] ??= []).push(c);
    }
    return map;
  }, [data]);

  return (
    <div>
      <PageHeader
        title="Connections"
        description="Link your social platforms and analytics sources to start pulling data."
      />

      {notice ? (
        <div className="mb-6 rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-100">
          {notice}
        </div>
      ) : null}

      {/* Provider connect cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ProviderCard
          name="Meta (Facebook & Instagram)"
          description="Page impressions, engagement, follower growth and Instagram reach."
          configured={data?.providers.meta ?? false}
          connecting={connecting === "meta"}
          onConnect={() => connect("meta")}
        />
        <ProviderCard
          name="Google Analytics (GA4)"
          description="Website active users, sessions and page views from your GA4 property."
          configured={data?.providers.google ?? false}
          connecting={connecting === "google"}
          onConnect={() => connect("google")}
        />
      </div>

      {/* Connected accounts */}
      <h2 className="mb-4 mt-10 text-lg font-semibold text-zinc-100">
        Linked accounts
      </h2>

      {loading ? (
        <div className="flex justify-center py-12 text-zinc-400">
          <Spinner className="size-6" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : (data?.connections.length ?? 0) === 0 ? (
        <EmptyState
          title="No accounts linked yet"
          description="Connect Meta or Google above to begin importing analytics."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([provider, conns]) => (
            <div key={provider}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {PROVIDER_LABEL[provider] ?? provider}
              </p>
              <div className="space-y-2">
                {conns.map((c) => (
                  <Card
                    key={c.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-100">
                        {c.accountName ?? c.externalAccountId}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        ID: {c.externalAccountId}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => disconnect(c.id)}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProviderCard({
  name,
  description,
  configured,
  connecting,
  onConnect,
}: {
  name: string;
  description: string;
  configured: boolean;
  connecting: boolean;
  onConnect: () => void;
}) {
  return (
    <Card className="flex flex-col p-5">
      <h3 className="text-base font-semibold text-zinc-100">{name}</h3>
      <p className="mt-1 flex-1 text-sm text-zinc-400">{description}</p>
      <div className="mt-4">
        {configured ? (
          <Button size="sm" onClick={onConnect} disabled={connecting}>
            {connecting ? <Spinner /> : "Connect"}
          </Button>
        ) : (
          <Badge tone="warning">Not configured on server</Badge>
        )}
      </div>
    </Card>
  );
}
