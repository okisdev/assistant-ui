"use client";

import { Coins, MessageSquare, Zap, Brain } from "lucide-react";

import { api } from "@/utils/trpc/client";
import { formatCost, formatTokens, type UsageTimeRange } from "@/lib/ai/utils";

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-muted/50 p-4">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-full bg-muted/50">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <span className="text-muted-foreground text-sm">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-semibold text-2xl">{value}</span>
        {subValue && (
          <span className="text-muted-foreground text-sm">{subValue}</span>
        )}
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex flex-col gap-2 rounded-lg bg-muted/50 p-4">
          <div className="flex items-center gap-2">
            <div className="size-8 animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function UsageOverview({ timeRange }: { timeRange: UsageTimeRange }) {
  const { data, isLoading } = api.usage.getStats.useQuery({ timeRange });

  if (isLoading) {
    return <OverviewSkeleton />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <StatCard
        icon={Zap}
        label="Total Tokens"
        value={formatTokens(data?.totalTokens ?? 0)}
        subValue={`${data?.requestCount ?? 0} requests`}
      />
      <StatCard
        icon={Coins}
        label="Estimated Cost"
        value={formatCost(data?.estimatedCost ?? 0)}
      />
      <StatCard
        icon={MessageSquare}
        label="Input Tokens"
        value={formatTokens(data?.inputTokens ?? 0)}
      />
      <StatCard
        icon={Brain}
        label="Output Tokens"
        value={formatTokens(data?.outputTokens ?? 0)}
        subValue={
          data?.reasoningTokens
            ? `(${formatTokens(data.reasoningTokens)} reasoning)`
            : undefined
        }
      />
    </div>
  );
}
