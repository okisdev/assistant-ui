"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Monitor,
  Smartphone,
  Globe,
  Trash2,
  LogOut,
  Loader2,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import type { Session } from "better-auth";

import { authClient } from "@/lib/auth.client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type DeviceType, parseUserAgent } from "@/utils/user-agent";
import { SettingHeader } from "@/components/dashboard/setting-header";

function DeviceIcon({ device }: { device: DeviceType }) {
  switch (device) {
    case "mobile":
    case "tablet":
      return <Smartphone className="size-5 text-muted-foreground" />;
    default:
      return <Monitor className="size-5 text-muted-foreground" />;
  }
}

function SessionSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3">
      <div className="size-10 animate-pulse rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

function SessionItem({
  session,
  isCurrentSession,
  isRevoking,
  onRevoke,
}: {
  session: Session;
  isCurrentSession: boolean;
  isRevoking: boolean;
  onRevoke: () => void;
}) {
  const { browser, os, device } = parseUserAgent(session.userAgent);

  return (
    <div className="flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted/50">
        <DeviceIcon device={device} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {browser} on {os}
          </span>
          {isCurrentSession && (
            <Badge variant="secondary" className="text-xs">
              Current
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-muted-foreground text-xs">
          <span className="flex items-center gap-1">
            <Globe className="size-3" />
            {session.ipAddress ?? "Unknown"}
          </span>
          <span>
            {formatDistanceToNow(new Date(session.updatedAt), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>

      {!isCurrentSession && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isRevoking}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              {isRevoking ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke this session?</AlertDialogTitle>
              <AlertDialogDescription>
                This will sign you out from {browser} on {os}. You&apos;ll need
                to sign in again on that device.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onRevoke}>Revoke</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

export function SessionList() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const { data: currentSession } = authClient.useSession();

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await authClient.listSessions();
      if (error) {
        toast.error("Failed to load sessions");
        return;
      }
      setSessions(data ?? []);
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevokeSession = async (token: string) => {
    setIsRevoking(token);
    try {
      const { error } = await authClient.revokeSession({ token });
      if (error) {
        toast.error("Failed to revoke session");
        return;
      }
      toast.success("Session revoked");
      setSessions((prev) => prev.filter((s) => s.token !== token));
    } catch {
      toast.error("Failed to revoke session");
    } finally {
      setIsRevoking(null);
    }
  };

  const handleRevokeOtherSessions = async () => {
    setIsRevokingAll(true);
    try {
      const { error } = await authClient.revokeOtherSessions();
      if (error) {
        toast.error("Failed to revoke sessions");
        return;
      }
      toast.success("All other sessions revoked");
      await fetchSessions();
    } catch {
      toast.error("Failed to revoke sessions");
    } finally {
      setIsRevokingAll(false);
    }
  };

  const currentSessionToken = currentSession?.session?.token;
  const otherSessions = sessions.filter((s) => s.token !== currentSessionToken);

  const sessionAction = otherSessions.length > 0 && (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground data-[state=open]:bg-muted"
          >
            {isRevokingAll ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MoreVertical className="size-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <LogOut className="size-4" />
              Sign out all other
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sign out all other sessions?</AlertDialogTitle>
          <AlertDialogDescription>
            This will sign you out from all other devices. Your current session
            will remain active.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRevokeOtherSessions}>
            Sign out all
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div className="flex flex-col gap-4">
      <SettingHeader title="Active Sessions" action={sessionAction} />

      <div className="flex flex-col gap-2">
        {isLoading ? (
          <>
            <SessionSkeleton />
            <SessionSkeleton />
            <SessionSkeleton />
          </>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No active sessions
          </div>
        ) : (
          sessions.map((session) => (
            <SessionItem
              key={session.token}
              session={session}
              isCurrentSession={session.token === currentSessionToken}
              isRevoking={isRevoking === session.token}
              onRevoke={() => handleRevokeSession(session.token)}
            />
          ))
        )}
      </div>
    </div>
  );
}
