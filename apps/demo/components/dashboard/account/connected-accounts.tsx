"use client";

import { useState } from "react";
import { Loader2, Unlink, Plus } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth.client";
import { api } from "@/utils/trpc/client";
import { Button } from "@/components/ui/button";
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
import { GitHub } from "@/components/icons/github";
import { Google } from "@/components/icons/google";
import { SettingHeader } from "@/components/dashboard/setting-header";

const PROVIDERS = {
  github: {
    name: "GitHub",
    icon: GitHub,
  },
  google: {
    name: "Google",
    icon: Google,
  },
} as const;

type ProviderId = keyof typeof PROVIDERS;

function ProviderIcon({ providerId }: { providerId: string }) {
  const provider = PROVIDERS[providerId as ProviderId];
  if (provider) {
    const Icon = provider.icon;
    return <Icon className="size-5 text-muted-foreground" />;
  }
  return <div className="size-5 rounded-full bg-muted" />;
}

function getProviderName(providerId: string): string {
  return PROVIDERS[providerId as ProviderId]?.name ?? providerId;
}

export function ConnectedAccounts() {
  const [isUnlinking, setIsUnlinking] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState<string | null>(null);

  const {
    data: accounts,
    isLoading,
    refetch,
  } = api.user.account.list.useQuery();

  const unlinkMutation = api.user.account.unlink.useMutation({
    onSuccess: () => {
      toast.success("Account disconnected");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled: () => {
      setIsUnlinking(null);
    },
  });

  const handleUnlink = (providerId: string) => {
    setIsUnlinking(providerId);
    unlinkMutation.mutate({ providerId });
  };

  const handleLink = async (providerId: ProviderId) => {
    setIsLinking(providerId);
    try {
      await authClient.linkSocial({
        provider: providerId,
        callbackURL: "/account",
      });
    } catch {
      toast.error(`Failed to connect ${getProviderName(providerId)}`);
      setIsLinking(null);
    }
  };

  const connectedProviderIds = new Set(
    accounts?.map((a) => a.providerId) ?? [],
  );
  const availableProviders = Object.keys(PROVIDERS).filter(
    (p) => !connectedProviderIds.has(p),
  ) as ProviderId[];

  return (
    <div className="flex flex-col gap-4">
      <SettingHeader title="Connected Accounts" />

      <div className="flex flex-col gap-2">
        {accounts?.map((account) => (
          <div
            key={account.id}
            className="flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3 transition-colors duration-200 hover:bg-muted"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-muted/50">
              <ProviderIcon providerId={account.providerId} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm">
                {getProviderName(account.providerId)}
              </div>
              <div className="text-muted-foreground text-xs">Connected</div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={isUnlinking === account.providerId}
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  {isUnlinking === account.providerId ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Unlink className="size-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Disconnect {getProviderName(account.providerId)}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    You will no longer be able to sign in with{" "}
                    {getProviderName(account.providerId)}. Make sure you have
                    another way to access your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleUnlink(account.providerId)}
                  >
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}

        {availableProviders.map((providerId) => (
          <div
            key={providerId}
            className="flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3 transition-colors duration-200 hover:bg-muted"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-muted/50">
              <ProviderIcon providerId={providerId} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm">
                {getProviderName(providerId)}
              </div>
              <div className="text-muted-foreground text-xs">Not connected</div>
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isLinking === providerId}
              className="text-muted-foreground hover:bg-muted-foreground/10 hover:text-muted-foreground"
              onClick={() => handleLink(providerId)}
            >
              {isLinking === providerId ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
            </Button>
          </div>
        ))}

        {!isLoading &&
          accounts?.length === 0 &&
          availableProviders.length === 0 && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No social providers available
            </div>
          )}
      </div>
    </div>
  );
}
