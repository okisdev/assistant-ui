"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth.client";
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
import { cn } from "@/lib/utils";

function AccountInfoSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-7 w-32 animate-pulse rounded bg-muted" />
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function AccountInfo() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [copied, setCopied] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const userId = session?.user?.id;

  const handleCopyUserId = async () => {
    if (!userId) return;

    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to sign out");
      setIsSigningOut(false);
    }
  };

  if (isPending) {
    return <AccountInfoSkeleton />;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-medium text-xl tracking-tight">Account</h1>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3 transition-colors duration-200 hover:bg-muted/50">
          <span className="text-muted-foreground text-sm">User ID</span>
          {userId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyUserId}
              className="text-muted-foreground transition-all duration-200"
            >
              <span
                className={cn(
                  "inline-flex items-center gap-2 transition-all duration-300",
                  copied ? "scale-105" : "scale-100",
                )}
              >
                {copied ? (
                  <>
                    <Check className="size-4 animate-[bounce-in_0.3s_ease-out]" />
                    <span className="animate-[fade-in_0.2s_ease-out]">
                      Copied
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="size-4 transition-transform duration-200 group-hover:scale-110" />
                    Click to copy
                  </>
                )}
              </span>
            </Button>
          )}
        </div>

        <div className="group flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3 transition-colors duration-200 hover:bg-muted/50">
          <span className="text-muted-foreground text-sm">Sign out</span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isSigningOut}
                className="text-destructive transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
              >
                {isSigningOut ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogOut className="size-4 transition-transform duration-200 group-hover:translate-x-[-2px]" />
                )}
                Sign out
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign out?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will be signed out from this device and redirected to the
                  home page.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSignOut}>
                  Sign out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
