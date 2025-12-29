"use client";

import { Coins, ArrowDownToLine, ArrowUpFromLine, Zap } from "lucide-react";

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
    <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 sm:gap-3 sm:p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted/50 sm:size-10">
        <Icon className="size-4 text-muted-foreground sm:size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] text-muted-foreground sm:text-xs">
          {label}
        </p>
        <p className="truncate font-semibold text-base tabular-nums sm:text-lg">
          {value}
        </p>
        {subValue && (
          <p className="hidden truncate text-muted-foreground text-xs sm:block">
            {subValue}
          </p>
        )}
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 sm:p-4"
        >
          <div className="size-9 animate-pulse rounded-full bg-muted sm:size-10" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-12 animate-pulse rounded bg-muted sm:w-16" />
            <div className="h-5 w-16 animate-pulse rounded bg-muted sm:w-20" />
          </div>
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
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
        icon={ArrowDownToLine}
        label="Input"
        value={formatTokens(data?.inputTokens ?? 0)}
      />
      <StatCard
        icon={ArrowUpFromLine}
        label="Output"
        value={formatTokens(data?.outputTokens ?? 0)}
        subValue={
          data?.reasoningTokens
            ? `${formatTokens(data.reasoningTokens)} reasoning`
            : undefined
        }
      />
    </div>
  );
}
