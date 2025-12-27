"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Server,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Wrench,
  Loader2,
  ChevronRight,
  Key,
  Unlink,
  ExternalLink,
  GlobeIcon,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { getFaviconUrl } from "@/utils/image";
import { api } from "@/utils/trpc/client";
import type { RouterOutputs } from "@/server";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { SettingHeader } from "@/components/dashboard/setting-header";
import { MCPServerDialog } from "./mcp-server-dialog";

function MCPServerSkeleton() {
  return (
    <div className="rounded-lg bg-muted/50 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="size-4 animate-pulse rounded bg-muted" />
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

function ToolBadgeSkeleton() {
  return <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />;
}

type MCPServer = RouterOutputs["mcpServer"]["list"][number];

type OAuthStatus = "connected" | "expired" | "required" | "not-required";

function getOAuthStatus(server: MCPServer): OAuthStatus {
  if (!server.requiresOAuth) return "not-required";
  if (!server.oauthAccessToken) return "required";
  if (server.oauthTokenExpiresAt) {
    const expiresAt = new Date(server.oauthTokenExpiresAt);
    if (expiresAt < new Date()) return "expired";
  }
  return "connected";
}

export function MCPServerSection() {
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<MCPServer | undefined>();
  const [deleteServer, setDeleteServer] = useState<MCPServer | null>(null);
  const [disconnectServer, setDisconnectServer] = useState<MCPServer | null>(
    null,
  );

  const { data: servers, isLoading } = api.mcpServer.list.useQuery();
  const utils = api.useUtils();

  useEffect(() => {
    const oauthError = searchParams.get("oauth_error");
    const oauthSuccess = searchParams.get("oauth_success");

    if (oauthError) {
      toast.error(`OAuth failed: ${oauthError}`);
      window.history.replaceState({}, "", "/integrations");
    } else if (oauthSuccess) {
      toast.success("OAuth connected successfully");
      utils.mcpServer.list.invalidate();
      window.history.replaceState({}, "", "/integrations");
    }
  }, [searchParams, utils.mcpServer.list]);

  const updateMutation = api.mcpServer.update.useMutation({
    onSuccess: () => {
      utils.mcpServer.list.invalidate();
    },
    onError: () => {
      toast.error("Failed to update server");
    },
  });

  const deleteMutation = api.mcpServer.delete.useMutation({
    onSuccess: () => {
      toast.success("Server deleted");
      utils.mcpServer.list.invalidate();
      setDeleteServer(null);
    },
    onError: () => {
      toast.error("Failed to delete server");
    },
  });

  const disconnectMutation = api.mcpServer.disconnectOAuth.useMutation({
    onSuccess: () => {
      toast.success("OAuth disconnected");
      utils.mcpServer.list.invalidate();
      setDisconnectServer(null);
    },
    onError: () => {
      toast.error("Failed to disconnect OAuth");
    },
  });

  const handleToggleEnabled = (server: MCPServer) => {
    updateMutation.mutate({
      id: server.id,
      enabled: !server.enabled,
    });
  };

  const handleEdit = (server: MCPServer) => {
    setEditingServer(server);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingServer(undefined);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingServer(undefined);
    }
  };

  const handleOAuthConnect = (server: MCPServer) => {
    window.location.href = `/api/mcp/oauth/authorize?serverId=${server.id}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <SettingHeader
        title="MCP Servers"
        action={
          <Button variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="mr-1 size-4" />
            Add Server
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <MCPServerSkeleton />
          <MCPServerSkeleton />
          <MCPServerSkeleton />
        </div>
      ) : servers && servers.length > 0 ? (
        <div className="flex flex-col gap-2">
          {servers.map((server) => (
            <MCPServerRow
              key={server.id}
              server={server}
              onToggle={() => handleToggleEnabled(server)}
              onEdit={() => handleEdit(server)}
              onDelete={() => setDeleteServer(server)}
              onOAuthConnect={() => handleOAuthConnect(server)}
              onOAuthDisconnect={() => setDisconnectServer(server)}
              isToggling={
                updateMutation.isPending &&
                updateMutation.variables?.id === server.id
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState onAdd={handleAdd} />
      )}

      <MCPServerDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        server={editingServer}
      />

      <AlertDialog
        open={!!deleteServer}
        onOpenChange={(open) => !open && setDeleteServer(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete MCP Server</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteServer?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteServer && deleteMutation.mutate({ id: deleteServer.id })
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-1 size-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!disconnectServer}
        onOpenChange={(open) => !open && setDisconnectServer(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect OAuth</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the OAuth connection for &quot;
              {disconnectServer?.name}&quot;. You&apos;ll need to reconnect to
              use this server again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                disconnectServer &&
                disconnectMutation.mutate({ id: disconnectServer.id })
              }
            >
              {disconnectMutation.isPending && (
                <Loader2 className="mr-1 size-4 animate-spin" />
              )}
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ToolBadge({
  name,
  description,
}: {
  name: string;
  description?: string;
}) {
  const badge = (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-medium text-xs transition-colors hover:bg-muted/80">
      <Wrench className="size-3" />
      {name}
    </span>
  );

  if (!description) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-xs">{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function MCPServerRow({
  server,
  onToggle,
  onEdit,
  onDelete,
  onOAuthConnect,
  onOAuthDisconnect,
  isToggling,
}: {
  server: MCPServer;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOAuthConnect: () => void;
  onOAuthDisconnect: () => void;
  isToggling: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const oauthStatus = getOAuthStatus(server);
  const faviconUrl = getFaviconUrl(server.url);

  const canShowTools =
    oauthStatus === "connected" || oauthStatus === "not-required";

  useEffect(() => {
    if (!canShowTools) {
      setIsOpen(false);
    }
  }, [canShowTools]);

  const checkConnectionMutation = api.mcpServer.checkConnection.useMutation({
    onSuccess: (result) => {
      if (result.connected) {
        toast.success(`Connection OK - ${result.toolCount} tools available`);
      } else {
        toast.error(`Connection failed: ${result.error}`);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to check connection");
    },
  });

  const { data: tools, isLoading: isLoadingTools } =
    api.mcpServer.getTools.useQuery(
      { id: server.id },
      {
        staleTime: 5 * 60 * 1000,
        enabled: canShowTools,
      },
    );

  const toolCount = tools?.length ?? 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg bg-muted/50">
        <div className="flex w-full items-center gap-3 rounded-lg px-4 py-3">
          <CollapsibleTrigger
            disabled={!canShowTools}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-3 text-left transition-colors",
              canShowTools && "hover:opacity-70",
            )}
          >
            <ChevronRight
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-90",
                !canShowTools && "invisible",
              )}
            />
            <div className="relative size-5 shrink-0">
              {faviconUrl ? (
                <img
                  src={faviconUrl}
                  alt=""
                  width={20}
                  height={20}
                  className="size-5 rounded-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove(
                      "hidden",
                    );
                  }}
                />
              ) : null}
              <GlobeIcon
                className={cn(
                  "absolute inset-0 size-5 text-muted-foreground",
                  faviconUrl && "hidden",
                )}
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{server.name}</span>
                <span className="rounded bg-muted px-2 py-0.5 text-muted-foreground text-xs uppercase">
                  {server.transportType}
                </span>
                {oauthStatus === "connected" && (
                  <OAuthStatusBadge status={oauthStatus} />
                )}
                {canShowTools && !isLoadingTools && toolCount > 0 && (
                  <span className="text-muted-foreground text-xs">
                    {toolCount} tool{toolCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <p className="max-w-[300px] truncate text-muted-foreground text-xs">
                {server.url}
              </p>
            </div>
          </CollapsibleTrigger>
          <div className="flex shrink-0 items-center gap-2">
            {oauthStatus === "required" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onOAuthConnect}
                className="h-7"
              >
                <ExternalLink className="mr-1 size-3" />
                Connect
              </Button>
            ) : (
              <Switch
                checked={server.enabled}
                onCheckedChange={onToggle}
                disabled={isToggling}
              />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canShowTools && (
                  <>
                    <DropdownMenuItem
                      onClick={() =>
                        checkConnectionMutation.mutate({ id: server.id })
                      }
                      disabled={checkConnectionMutation.isPending}
                    >
                      <RefreshCw
                        className={cn(
                          "mr-2 size-4",
                          checkConnectionMutation.isPending && "animate-spin",
                        )}
                      />
                      Check Connection
                    </DropdownMenuItem>
                    {oauthStatus === "connected" && (
                      <>
                        <DropdownMenuItem onClick={onOAuthConnect}>
                          <Key className="mr-2 size-4" />
                          Reconnect OAuth
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onOAuthDisconnect}>
                          <Unlink className="mr-2 size-4" />
                          Disconnect OAuth
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CollapsibleContent>
          <div className="px-4 pt-0 pb-4 pl-12">
            {isLoadingTools ? (
              <div className="flex flex-wrap gap-2">
                <ToolBadgeSkeleton />
                <ToolBadgeSkeleton />
                <ToolBadgeSkeleton />
                <ToolBadgeSkeleton />
              </div>
            ) : tools && tools.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tools.map((tool) => (
                  <ToolBadge
                    key={tool.name}
                    name={tool.name}
                    description={tool.description}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                No tools available from this server
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function OAuthStatusBadge({ status }: { status: "connected" | "expired" }) {
  if (status === "connected") {
    return (
      <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-500 text-xs">
        OAuth
      </span>
    );
  }
  return (
    <span className="rounded bg-amber-500/10 px-2 py-0.5 text-amber-500 text-xs">
      OAuth Expired
    </span>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg bg-muted/50 py-16">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted/50">
        <Server className="size-8 text-muted-foreground" />
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="font-medium text-sm">No MCP servers connected</p>
        <p className="max-w-xs text-muted-foreground text-sm">
          Connect to MCP servers to extend AI capabilities with custom tools.
        </p>
      </div>
      <Button variant="outline" onClick={onAdd}>
        <Plus className="mr-1 size-4" />
        Add Server
      </Button>
    </div>
  );
}
