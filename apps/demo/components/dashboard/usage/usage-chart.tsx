"use client";

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { api } from "@/utils/trpc/client";
import { formatTokens, type UsageTimeRange } from "@/lib/ai/utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  totalTokens: {
    label: "Tokens",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ChartSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      <div className="h-48 w-full animate-pulse rounded bg-muted/50" />
    </div>
  );
}

export function UsageChart({ timeRange }: { timeRange: UsageTimeRange }) {
  const { data, isLoading } = api.usage.getByDay.useQuery({ timeRange });

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((item) => ({
      date: item.date,
      dateLabel: formatDate(item.date),
      totalTokens: item.totalTokens,
      requestCount: item.requestCount,
    }));
  }, [data]);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg bg-muted/50 py-8">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted/50">
          <TrendingUp className="size-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm">No usage data yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-medium text-sm">Daily Usage Trend</h3>
      <ChartContainer config={chartConfig} className="h-48 w-full">
        <AreaChart
          accessibilityLayer
          data={chartData}
          margin={{ left: -20, right: 12 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="dateLabel"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => value}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => formatTokens(value)}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                indicator="line"
                labelFormatter={(_, payload) => {
                  if (payload?.[0]?.payload) {
                    const data = payload[0].payload as {
                      date: string;
                      requestCount: number;
                    };
                    return formatDate(data.date);
                  }
                  return "";
                }}
                formatter={(_, __, item) => {
                  const data = item.payload as {
                    totalTokens: number;
                    requestCount: number;
                  };
                  return (
                    <div className="flex flex-col gap-0.5">
                      <span>
                        {formatTokens(data.totalTokens)}{" "}
                        <span className="text-muted-foreground">tokens</span>
                      </span>
                      <span>
                        {data.requestCount}{" "}
                        <span className="text-muted-foreground">requests</span>
                      </span>
                    </div>
                  );
                }}
              />
            }
          />
          <defs>
            <linearGradient id="fillTokens" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-totalTokens)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-totalTokens)"
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>
          <Area
            dataKey="totalTokens"
            type="natural"
            fill="url(#fillTokens)"
            fillOpacity={0.4}
            stroke="var(--color-totalTokens)"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
