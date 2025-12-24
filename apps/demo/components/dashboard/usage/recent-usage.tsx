"use client";

import { useState } from "react";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDownAZ,
  ArrowUpDown,
  Check,
  Clock,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/utils/trpc/client";
import { getModelById } from "@/lib/ai/models";
import { formatCost, formatTokens } from "@/lib/ai/utils";

type UsageItem = {
  id: string;
  chatId: string | null;
  messageId: string | null;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number | null;
  totalTokens: number;
  estimatedCost: number | null;
  createdAt: Date;
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type SortOption = {
  id: string;
  label: string;
  sortKey: keyof UsageItem;
  desc: boolean;
};

const sortOptions: SortOption[] = [
  { id: "recent", label: "Most Recent", sortKey: "createdAt", desc: true },
  { id: "oldest", label: "Oldest First", sortKey: "createdAt", desc: false },
  {
    id: "tokens-high",
    label: "Most Tokens",
    sortKey: "totalTokens",
    desc: true,
  },
  {
    id: "tokens-low",
    label: "Least Tokens",
    sortKey: "totalTokens",
    desc: false,
  },
  {
    id: "cost-high",
    label: "Highest Cost",
    sortKey: "estimatedCost",
    desc: true,
  },
  {
    id: "cost-low",
    label: "Lowest Cost",
    sortKey: "estimatedCost",
    desc: false,
  },
];

function UsageItemRow({ item }: { item: UsageItem }) {
  const model = getModelById(item.modelId);
  const Icon = model?.icon ?? MessageSquare;

  return (
    <div className="group flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3 transition-colors hover:bg-muted">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted/50">
        <Icon className="size-5 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-sm">
            {model?.name ?? item.modelId}
          </span>
          {item.chatId && (
            <Link
              href={`/chat/${item.chatId}`}
              className="inline-flex items-center gap-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
            >
              <ExternalLink className="size-3" />
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <span>{formatTokens(item.inputTokens)} in</span>
          <span className="text-muted-foreground/50">·</span>
          <span>{formatTokens(item.outputTokens)} out</span>
          {item.reasoningTokens ? (
            <>
              <span className="text-muted-foreground/50">·</span>
              <span>{formatTokens(item.reasoningTokens)} reasoning</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col items-end gap-0.5">
        <span className="font-medium text-sm tabular-nums">
          {formatTokens(item.totalTokens)}
        </span>
        <span className="text-muted-foreground text-xs tabular-nums">
          {formatCost(item.estimatedCost ?? 0)}
        </span>
      </div>

      <div className="w-16 text-right">
        <span className="text-muted-foreground text-xs">
          {formatRelativeTime(new Date(item.createdAt))}
        </span>
      </div>
    </div>
  );
}

function RecentSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3"
        >
          <div className="size-10 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="h-3 w-40 animate-pulse rounded bg-muted" />
          </div>
          <div className="space-y-1">
            <div className="h-4 w-12 animate-pulse rounded bg-muted" />
            <div className="h-3 w-10 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-3 w-14 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg bg-muted/50 py-12">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted/50">
        <Clock className="size-6 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground text-sm">No recent activity</p>
    </div>
  );
}

export function RecentUsage() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const { data, isLoading } = api.usage.getRecent.useQuery({ limit: 10 });

  const table = useReactTable({
    data: data ?? [],
    columns: [
      { accessorKey: "createdAt" },
      { accessorKey: "totalTokens" },
      { accessorKey: "estimatedCost" },
    ],
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  const currentSort = sortOptions.find(
    (opt) => sorting[0]?.id === opt.sortKey && sorting[0]?.desc === opt.desc,
  );

  const handleSort = (option: SortOption) => {
    setSorting([{ id: option.sortKey, desc: option.desc }]);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">Recent Activity</h3>
        </div>
        <RecentSkeleton />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="font-medium text-sm">Recent Activity</h3>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Recent Activity</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2">
              <ArrowDownAZ className="size-4" />
              <span className="text-xs">{currentSort?.label ?? "Sort"}</span>
              <ArrowUpDown className="size-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.id}
                onClick={() => handleSort(option)}
                className="flex items-center justify-between gap-4"
              >
                <span>{option.label}</span>
                {currentSort?.id === option.id && (
                  <Check className="size-4 text-muted-foreground" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-2">
        {table.getRowModel().rows.map((row) => (
          <UsageItemRow key={row.id} item={row.original} />
        ))}
      </div>
    </div>
  );
}
