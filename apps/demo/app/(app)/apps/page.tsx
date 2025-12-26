"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Search,
  FileText,
  Sparkles,
  ChevronRight,
  Construction,
} from "lucide-react";

import { api } from "@/utils/trpc/client";
import type { RouterOutputs } from "@/server";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Application = RouterOutputs["application"]["list"][number];
type Category = Application["category"] | "all";

const CATEGORY_LABELS: Record<Category, string> = {
  all: "All categories",
  productivity: "Productivity",
  communication: "Communication",
  development: "Development",
  design: "Design",
  other: "Other",
};

function ApplicationSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
      <div className="size-10 animate-pulse rounded-lg bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="h-3 w-48 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

function AppIcon({
  iconUrl,
  name,
  className,
}: {
  iconUrl: string | null;
  name: string;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!iconUrl || hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-muted text-muted-foreground",
          className,
        )}
      >
        <FileText className="size-5" />
      </div>
    );
  }

  return (
    <img
      src={iconUrl}
      alt={name}
      className={cn("rounded-lg object-contain", className)}
      onError={() => setHasError(true)}
    />
  );
}

function ApplicationCard({
  app,
  isConnected,
}: {
  app: Application;
  isConnected: boolean;
}) {
  return (
    <Link
      href={`/apps/${app.slug}`}
      className="group flex items-center gap-3 rounded-lg bg-muted/50 p-4 transition-colors hover:bg-muted"
    >
      <AppIcon
        iconUrl={app.iconUrl}
        name={app.name}
        className="size-10 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{app.name}</span>
          {app.status === "wip" && (
            <span className="flex items-center gap-1 rounded bg-amber-500/5 px-1.5 py-0.5 text-amber-600 text-xs">
              <Construction className="size-3" />
              Coming Soon
            </span>
          )}
          {isConnected && (
            <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-500 text-xs">
              <Check className="size-3" />
              Connected
            </span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-1 text-muted-foreground text-sm">
          {app.description}
        </p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="col-span-full flex flex-col items-center gap-4 py-20">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted/50">
        <Sparkles className="size-6 text-muted-foreground" />
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="font-medium">
          {searchQuery ? "No apps found" : "No apps available"}
        </p>
        <p className="max-w-xs text-muted-foreground text-sm">
          {searchQuery
            ? `No apps match "${searchQuery}"`
            : "Apps will appear here once configured."}
        </p>
      </div>
    </div>
  );
}

export default function AppsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const { data: apps, isLoading: isLoadingApps } =
    api.application.list.useQuery();
  const { data: connections, isLoading: isLoadingConnections } =
    api.application.userConnections.useQuery();

  const isLoading = isLoadingApps || isLoadingConnections;
  const connectedAppIds = new Set(
    connections?.filter((c) => c.isConnected).map((c) => c.applicationId) ?? [],
  );

  const filteredApps = apps?.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "all" || app.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const availableCategories: Category[] = [
    "all",
    ...new Set(apps?.map((app) => app.category) ?? []),
  ];

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 md:px-8">
        <div className="flex flex-col gap-1">
          <h1 className="font-semibold text-2xl tracking-tight">Apps</h1>
          <p className="text-muted-foreground">
            Connect apps to enhance your assistant with new capabilities
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {!isLoading && availableCategories.length > 2 && (
            <Select
              value={activeCategory}
              onValueChange={(value) => setActiveCategory(value as Category)}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {CATEGORY_LABELS[category]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ApplicationSkeleton key={i} />
            ))}
          </div>
        ) : filteredApps && filteredApps.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredApps.map((app) => (
              <ApplicationCard
                key={app.id}
                app={app}
                isConnected={connectedAppIds.has(app.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState searchQuery={searchQuery} />
        )}
      </div>
    </div>
  );
}
