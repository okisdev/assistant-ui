"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Loader2,
  ExternalLink,
  Check,
  Unlink,
  FileText,
  ArrowLeft,
  Globe,
  Calendar,
  MessageSquare,
  Code,
  Palette,
  Grid3X3,
  Construction,
  Link2,
  BadgeCheck,
  MoreHorizontal,
  Download,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/utils/trpc/client";
import { authClient } from "@/lib/auth.client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: typeof Calendar }
> = {
  productivity: { label: "Productivity", icon: Calendar },
  communication: { label: "Communication", icon: MessageSquare },
  development: { label: "Development", icon: Code },
  design: { label: "Design", icon: Palette },
  other: { label: "Other", icon: Grid3X3 },
};

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
          "flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground",
          className,
        )}
      >
        <FileText className="size-8" />
      </div>
    );
  }

  return (
    <img
      src={iconUrl}
      alt={name}
      className={cn("rounded-xl object-contain", className)}
      onError={() => setHasError(true)}
    />
  );
}

function PageSkeleton() {
  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 md:px-8">
        <div className="h-8 w-16 animate-pulse rounded bg-muted" />
        <div className="flex items-center gap-4">
          <div className="size-18 animate-pulse rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-32 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}

export default function AppDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  const { data: app, isLoading: isLoadingApp } = api.application.get.useQuery({
    slug,
  });

  const {
    data: connectionStatus,
    isLoading: isLoadingStatus,
    refetch: refetchStatus,
  } = api.application.getConnectionStatus.useQuery(
    { applicationId: app?.id ?? "" },
    { enabled: !!app?.id },
  );

  const utils = api.useUtils();

  const linkScopeMutation = api.application.linkScopeAccount.useMutation({
    onSuccess: () => {
      toast.success("App connected successfully");
      utils.application.userConnections.invalidate();
      refetchStatus();
      router.replace(`/apps/${slug}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to link account");
      router.replace(`/apps/${slug}`);
    },
  });

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (error) {
      toast.error(decodeURIComponent(error));
      router.replace(`/apps/${slug}`);
      return;
    }

    if (
      connected === "true" &&
      app?.id &&
      app.connection.type === "scope" &&
      !isLinking &&
      !linkScopeMutation.isPending
    ) {
      setIsLinking(true);
      linkScopeMutation.mutate({
        applicationId: app.id,
        provider: app.connection.provider,
      });
    }
  }, [
    searchParams,
    app?.id,
    app?.connection,
    slug,
    router,
    isLinking,
    linkScopeMutation,
  ]);

  const disconnectMutation = api.application.disconnect.useMutation({
    onSuccess: () => {
      toast.success("App disconnected");
      utils.application.userConnections.invalidate();
      refetchStatus();
      setShowDisconnectDialog(false);
    },
    onError: () => {
      toast.error("Failed to disconnect app");
    },
  });

  const toggleMutation = api.application.toggleEnabled.useMutation({
    onSuccess: () => {
      refetchStatus();
      utils.application.userConnections.invalidate();
    },
    onError: () => {
      toast.error("Failed to update app");
    },
  });

  const handleScopeConnect = async () => {
    if (!app || app.connection.type !== "scope") return;
    setIsConnecting(true);
    try {
      await authClient.linkSocial({
        provider: app.connection.provider,
        callbackURL: `/apps/${app.slug}?connected=true`,
        scopes: app.connection.scopes,
      });
    } catch (error) {
      toast.error(
        `Failed to connect: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setIsConnecting(false);
    }
  };

  const handleOAuthConnect = () => {
    if (!app || app.connection.type !== "oauth") return;
    setIsConnecting(true);
    window.location.href = `/api/connect/${app.connection.provider}`;
  };

  const installMutation = api.application.connect.useMutation({
    onSuccess: () => {
      toast.success("App installed successfully");
      utils.application.userConnections.invalidate();
      refetchStatus();
      setIsConnecting(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to install app");
      setIsConnecting(false);
    },
  });

  const handleNoAuthInstall = () => {
    if (!app || app.connection.type !== "none") return;
    setIsConnecting(true);
    installMutation.mutate({ applicationId: app.id });
  };

  const handleConnect = () => {
    if (!app) return;
    if (app.connection.type === "scope") {
      handleScopeConnect();
    } else if (app.connection.type === "none") {
      handleNoAuthInstall();
    } else {
      handleOAuthConnect();
    }
  };

  const handleToggleEnabled = () => {
    if (!app || !connectionStatus) return;
    toggleMutation.mutate({
      applicationId: app.id,
      enabled: !connectionStatus.enabled,
    });
  };

  const isLoading = isLoadingApp || isLoadingStatus;

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (!app) {
    return (
      <div className="flex flex-1 flex-col overflow-auto">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 md:px-8">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link href="/apps">
              <ArrowLeft className="mr-1.5 size-4" />
              Back
            </Link>
          </Button>
          <div className="flex flex-col items-center gap-4 rounded-lg bg-muted/50 py-16">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted/50">
              <FileText className="size-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">App not found</p>
          </div>
        </div>
      </div>
    );
  }

  const isConnected = connectionStatus?.connected;
  const categoryConfig = CATEGORY_CONFIG[app.category] ?? CATEGORY_CONFIG.other;
  const CategoryIcon = categoryConfig.icon;
  const isScopeConnection = app.connection.type === "scope";
  const isNoAuthConnection = app.connection.type === "none";

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 md:px-8">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
          <Link href="/apps">
            <ArrowLeft className="mr-1.5 size-4" />
            Back
          </Link>
        </Button>

        <div className="flex items-center gap-4">
          <AppIcon
            iconUrl={app.iconUrl}
            name={app.name}
            className="size-18 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-medium text-xl tracking-tight">{app.name}</h1>
              {app.status === "wip" && (
                <span className="flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-amber-600 text-xs">
                  <Construction className="size-3" />
                  Coming Soon
                </span>
              )}
              {isConnected && (
                <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-500 text-xs">
                  <Check className="size-3" />
                  {isNoAuthConnection ? "Installed" : "Connected"}
                </span>
              )}
            </div>
            <p className="mt-1 text-muted-foreground text-sm">
              {app.description}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
              {app.publisher && (
                <span className="flex items-center gap-1">
                  By {app.publisher}
                  {app.verified && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex cursor-help text-blue-500">
                          <BadgeCheck className="size-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="font-medium">Verified</p>
                        <p className="text-muted">
                          This app has been verified by assistant-ui
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </span>
              )}
              <span className="flex items-center gap-1">
                <CategoryIcon className="size-3" />
                {categoryConfig.label}
              </span>
            </div>
          </div>
          {isConnected && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 shrink-0">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setShowDisconnectDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  {isNoAuthConnection ? (
                    <Trash2 className="mr-2 size-4" />
                  ) : (
                    <Unlink className="mr-2 size-4" />
                  )}
                  {isNoAuthConnection ? "Uninstall" : "Disconnect"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {app.status === "published" ? (
          isConnected ? (
            <div className="flex flex-col gap-3">
              {connectionStatus.externalName && (
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Connected as</span>
                  <span className="font-medium">
                    {connectionStatus.externalName}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <span className="text-sm">Enable this app</span>
                <Switch
                  checked={connectionStatus.enabled}
                  onCheckedChange={handleToggleEnabled}
                  disabled={toggleMutation.isPending}
                />
              </div>
            </div>
          ) : (
            <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : isNoAuthConnection ? (
                <Download className="mr-2 size-4" />
              ) : isScopeConnection ? (
                <ExternalLink className="mr-2 size-4" />
              ) : (
                <Link2 className="mr-2 size-4" />
              )}
              {isNoAuthConnection ? "Install" : "Connect"} {app.name}
            </Button>
          )
        ) : (
          <div className="flex items-center justify-center rounded-lg bg-muted/50 px-4 py-3 text-muted-foreground text-sm">
            <Construction className="mr-2 size-4" />
            Coming soon
          </div>
        )}

        {(app.websiteUrl || app.privacyPolicyUrl || app.termsOfServiceUrl) && (
          <div className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 font-medium text-sm">
              <Globe className="size-4 text-muted-foreground" />
              Resources
            </h2>
            <div className="flex flex-col gap-2 text-sm">
              {app.websiteUrl && (
                <a
                  href={app.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  Website
                  <ExternalLink className="size-3" />
                </a>
              )}
              {app.privacyPolicyUrl && (
                <a
                  href={app.privacyPolicyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  Privacy Policy
                  <ExternalLink className="size-3" />
                </a>
              )}
              {app.termsOfServiceUrl && (
                <a
                  href={app.termsOfServiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  Terms of Service
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </div>
        )}

        <AlertDialog
          open={showDisconnectDialog}
          onOpenChange={setShowDisconnectDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {isNoAuthConnection ? "Uninstall" : "Disconnect"} {app.name}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {isNoAuthConnection
                  ? "You'll need to install again to use this app."
                  : "You'll need to reconnect to use this app again."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  disconnectMutation.mutate({ applicationId: app.id })
                }
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {disconnectMutation.isPending && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {isNoAuthConnection ? "Uninstall" : "Disconnect"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
