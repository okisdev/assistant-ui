"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Grid3X3,
  Calendar,
  FileText,
  MessageSquare,
  Code,
  Palette,
  Plus,
  Settings,
  MoreHorizontal,
} from "lucide-react";

import { api } from "@/utils/trpc/client";
import type { RouterOutputs } from "@/server";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SettingHeader } from "@/components/dashboard/setting-header";

type UserConnection = RouterOutputs["application"]["userConnections"][number];

const CATEGORY_ICONS: Record<string, typeof Calendar> = {
  productivity: Calendar,
  communication: MessageSquare,
  development: Code,
  design: Palette,
  other: Grid3X3,
};

const CATEGORY_LABELS: Record<string, string> = {
  productivity: "Productivity",
  communication: "Communication",
  development: "Development",
  design: "Design",
  other: "Other",
};

function ApplicationSkeleton() {
  return (
    <div className="rounded-lg bg-muted/50 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="size-5 animate-pulse rounded bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-3 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-5 w-9 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}

function AppIcon({
  iconUrl,
  name,
  className,
}: {
  iconUrl: string | null | undefined;
  name: string;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!iconUrl || hasError) {
    return <FileText className={cn("text-muted-foreground", className)} />;
  }

  return (
    <img
      src={iconUrl}
      alt={name}
      className={cn("rounded-sm object-contain", className)}
      onError={() => setHasError(true)}
    />
  );
}

function InstalledAppCard({
  connection,
  onToggle,
  isToggling,
}: {
  connection: UserConnection;
  onToggle: (connection: UserConnection) => void;
  isToggling: boolean;
}) {
  const app = connection.application;
  const CategoryIcon = CATEGORY_ICONS[app.category] ?? Grid3X3;

  return (
    <div className="rounded-lg bg-muted/50">
      <div className="flex w-full items-center gap-3 px-4 py-3">
        <AppIcon
          iconUrl={app.iconUrl}
          name={app.name}
          className="size-5 shrink-0"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{app.name}</span>
            <span className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-muted-foreground text-xs">
              <CategoryIcon className="size-3" />
              {CATEGORY_LABELS[app.category] ?? "Other"}
            </span>
          </div>
          <p className="max-w-[300px] truncate text-muted-foreground text-xs">
            {app.description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Switch
            checked={connection.enabled}
            onCheckedChange={() => onToggle(connection)}
            disabled={isToggling}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/apps/${app.slug}`}>
                  <Settings className="mr-2 size-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg bg-muted/50 py-16">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted/50">
        <Grid3X3 className="size-8 text-muted-foreground" />
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="font-medium text-sm">No applications installed</p>
        <p className="max-w-xs text-muted-foreground text-sm">
          Browse available applications and connect them to extend AI
          capabilities.
        </p>
      </div>
      <Button variant="outline" asChild>
        <Link href="/apps">
          <Plus className="mr-1 size-4" />
          Browse Applications
        </Link>
      </Button>
    </div>
  );
}

export function ApplicationsSection() {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data: connections, isLoading } =
    api.application.userConnections.useQuery();
  const utils = api.useUtils();

  const toggleMutation = api.application.toggleEnabled.useMutation({
    onSuccess: () => {
      utils.application.userConnections.invalidate();
      setTogglingId(null);
    },
    onError: () => {
      setTogglingId(null);
    },
  });

  const handleToggle = (connection: UserConnection) => {
    setTogglingId(connection.id);
    toggleMutation.mutate({
      applicationId: connection.applicationId,
      enabled: !connection.enabled,
    });
  };

  const installedApps = connections?.filter((c) => c.isConnected) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <SettingHeader
        title="Applications"
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/apps">
              <Plus className="mr-1 size-4" />
              Add Application
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <ApplicationSkeleton />
          <ApplicationSkeleton />
        </div>
      ) : installedApps.length > 0 ? (
        <div className="flex flex-col gap-2">
          {installedApps.map((connection) => (
            <InstalledAppCard
              key={connection.id}
              connection={connection}
              onToggle={handleToggle}
              isToggling={togglingId === connection.id}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
