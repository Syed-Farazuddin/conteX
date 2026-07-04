import type { ReactNode } from "react";
import { Card } from "@/components/ui/ui";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function StatCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: number | string;
  icon?: ReactNode;
  hint?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-400">{label}</p>
        {icon ? <span className="text-zinc-500">{icon}</span> : null}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50">
        {typeof value === "number" ? formatNumber(value) : value}
      </p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </Card>
  );
}
