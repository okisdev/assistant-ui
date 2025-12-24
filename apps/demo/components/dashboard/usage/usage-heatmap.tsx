"use client";

import { useMemo, useRef, useEffect } from "react";
import { Activity } from "lucide-react";

import { api } from "@/utils/trpc/client";
import { cn } from "@/lib/utils";
import { formatTokens } from "@/lib/ai/utils";

type HeatmapData = {
  date: string;
  totalTokens: number;
  requestCount: number;
};

const CELL_SIZE = 10;
const CELL_GAP = 2;
const CELL_WITH_GAP = CELL_SIZE + CELL_GAP;
const DAY_LABEL_WIDTH = 24;

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayString(): string {
  return toLocalDateString(new Date());
}

function generateDateRange(): string[] {
  const dates: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(toLocalDateString(date));
  }

  return dates;
}

function getIntensityLevel(tokens: number, maxTokens: number): number {
  if (tokens === 0) return 0;
  if (maxTokens === 0) return 0;
  const ratio = tokens / maxTokens;
  if (ratio < 0.25) return 1;
  if (ratio < 0.5) return 2;
  if (ratio < 0.75) return 3;
  return 4;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year!, month! - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function HeatmapSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-4 w-40 animate-pulse rounded bg-muted" />
      <div className="h-24 w-full animate-pulse rounded bg-muted/50" />
    </div>
  );
}

export function UsageHeatmap() {
  const { data, isLoading } = api.usage.getHeatmap.useQuery();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { dataMap, maxTokens, weeks, monthLabels, todayString } =
    useMemo(() => {
      const dateRange = generateDateRange();
      const dataMap = new Map<string, HeatmapData>();
      const todayString = getTodayString();

      if (data) {
        for (const item of data) {
          dataMap.set(item.date, item);
        }
      }

      const maxTokens = data
        ? Math.max(...data.map((d) => d.totalTokens), 1)
        : 1;

      const weeks: string[][] = [];
      let currentWeek: string[] = [];

      const firstDateParts = dateRange[0]!.split("-").map(Number);
      const firstDate = new Date(
        firstDateParts[0]!,
        firstDateParts[1]! - 1,
        firstDateParts[2],
      );
      const firstDayOfWeek = firstDate.getDay();
      for (let i = 0; i < firstDayOfWeek; i++) {
        currentWeek.push("");
      }

      for (const date of dateRange) {
        currentWeek.push(date);
        if (currentWeek.length === 7) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
      }

      if (currentWeek.length > 0) {
        weeks.push(currentWeek);
      }

      const monthLabels: { label: string; weekIndex: number }[] = [];
      let lastMonth = -1;

      weeks.forEach((week, weekIndex) => {
        const firstValidDate = week.find((d) => d !== "");
        if (firstValidDate) {
          const parts = firstValidDate.split("-").map(Number);
          const date = new Date(parts[0]!, parts[1]! - 1, parts[2]);
          const month = date.getMonth();
          if (month !== lastMonth) {
            monthLabels.push({
              label: date.toLocaleDateString("en-US", { month: "short" }),
              weekIndex,
            });
            lastMonth = month;
          }
        }
      });

      return { dataMap, maxTokens, weeks, monthLabels, todayString };
    }, [data]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [weeks]);

  if (isLoading) {
    return <HeatmapSkeleton />;
  }

  const dayLabels = ["", "M", "", "W", "", "F", ""];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Activity</h3>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn(
                "rounded-sm",
                level === 0 && "bg-muted/50",
                level === 1 && "bg-emerald-500/30",
                level === 2 && "bg-emerald-500/50",
                level === 3 && "bg-emerald-500/70",
                level === 4 && "bg-emerald-500",
              )}
              style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` }}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {!data || data.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg bg-muted/50 py-8">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted/50">
            <Activity className="size-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">No activity yet</p>
        </div>
      ) : (
        <div className="flex">
          <div
            className="flex shrink-0 flex-col"
            style={{ width: `${DAY_LABEL_WIDTH}px`, paddingTop: "14px" }}
          >
            {dayLabels.map((label, i) => (
              <div
                key={i}
                className="flex items-center justify-end pr-1 text-[10px] text-muted-foreground"
                style={{ height: `${CELL_WITH_GAP}px` }}
              >
                {label}
              </div>
            ))}
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="ml-auto inline-flex flex-col items-end">
              <div className="mb-0.5 flex h-3 self-stretch">
                {monthLabels.map((month, index) => {
                  const nextMonth = monthLabels[index + 1];
                  const width = nextMonth
                    ? (nextMonth.weekIndex - month.weekIndex) * CELL_WITH_GAP
                    : (weeks.length - month.weekIndex) * CELL_WITH_GAP;

                  return (
                    <div
                      key={`${month.label}-${index}`}
                      className="text-[10px] text-muted-foreground"
                      style={{
                        width: `${width}px`,
                        marginLeft:
                          index === 0
                            ? `${month.weekIndex * CELL_WITH_GAP}px`
                            : 0,
                      }}
                    >
                      {month.label}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-0.5">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-0.5">
                    {week.map((date, dayIndex) => {
                      if (!date) {
                        return (
                          <div
                            key={`empty-${dayIndex}`}
                            style={{
                              width: `${CELL_SIZE}px`,
                              height: `${CELL_SIZE}px`,
                            }}
                          />
                        );
                      }

                      const dayData = dataMap.get(date);
                      const level = getIntensityLevel(
                        dayData?.totalTokens ?? 0,
                        maxTokens,
                      );
                      const isToday = date === todayString;
                      const showBelow = dayIndex < 3;

                      return (
                        <div
                          key={date}
                          className={cn(
                            "group relative rounded-sm transition-transform hover:scale-125",
                            level === 0 && "bg-muted/50",
                            level === 1 && "bg-emerald-500/30",
                            level === 2 && "bg-emerald-500/50",
                            level === 3 && "bg-emerald-500/70",
                            level === 4 && "bg-emerald-500",
                            isToday && "ring-1 ring-foreground/50",
                          )}
                          style={{
                            width: `${CELL_SIZE}px`,
                            height: `${CELL_SIZE}px`,
                          }}
                        >
                          <div
                            className={cn(
                              "pointer-events-none absolute left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-1 text-[10px] text-background shadow-lg group-hover:block",
                              showBelow ? "top-full mt-1" : "bottom-full mb-1",
                            )}
                          >
                            <div className="font-medium">
                              {formatDate(date)}
                              {isToday && " (Today)"}
                            </div>
                            <div className="text-background/70">
                              {dayData
                                ? `${formatTokens(dayData.totalTokens)} · ${dayData.requestCount} req`
                                : "No activity"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
