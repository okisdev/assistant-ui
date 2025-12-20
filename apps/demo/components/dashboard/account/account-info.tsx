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
        <div className="flex h-14 items-center justify-between rounded-lg bg-muted/30 px-4">
          <div className="h-4 w-12 animate-pulse rounded bg-muted" />
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex h-14 items-center justify-between rounded-lg bg-muted/30 px-4">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex h-14 items-center justify-between rounded-lg bg-muted/30 px-4">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-5 w-20 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function AccountInfo() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [copiedField, setCopiedField] = useState<"email" | "userId" | null>(
    null,
  );
  const [isSigningOut, setIsSigningOut] = useState(false);

  const userId = session?.user?.id;
  const email = session?.user?.email;

  const handleCopy = async (value: string, field: "email" | "userId") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
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
        <div className="flex h-14 items-center justify-between rounded-lg bg-muted/30 px-4 transition-colors duration-200 hover:bg-muted/50">
          <span className="text-muted-foreground text-sm">Email</span>
          {email && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(email, "email")}
              className="text-muted-foreground transition-all duration-200"
            >
              <span
                className={cn(
                  "inline-flex items-center gap-2 transition-all duration-300",
                  copiedField === "email" ? "scale-105" : "scale-100",
                )}
              >
                {copiedField === "email" ? (
                  <>
                    <span className="animate-[fade-in_0.2s_ease-out]">
                      Copied
                    </span>
                    <Check className="size-4 animate-[bounce-in_0.3s_ease-out]" />
                  </>
                ) : (
                  <>
                    {email}
                    <Copy className="size-4" />
                  </>
                )}
              </span>
            </Button>
          )}
        </div>

        <div className="flex h-14 items-center justify-between rounded-lg bg-muted/30 px-4 transition-colors duration-200 hover:bg-muted/50">
          <span className="text-muted-foreground text-sm">User ID</span>
          {userId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(userId, "userId")}
              className="text-muted-foreground transition-all duration-200"
            >
              <span
                className={cn(
                  "inline-flex items-center gap-2 transition-all duration-300",
                  copiedField === "userId" ? "scale-105" : "scale-100",
                )}
              >
                {copiedField === "userId" ? (
                  <>
                    <span className="animate-[fade-in_0.2s_ease-out]">
                      Copied
                    </span>
                    <Check className="size-4 animate-[bounce-in_0.3s_ease-out]" />
                  </>
                ) : (
                  <>
                    {userId.slice(0, 8)}...
                    <Copy className="size-4" />
                  </>
                )}
              </span>
            </Button>
          )}
        </div>

        <div className="group flex h-14 items-center justify-between rounded-lg bg-muted/30 px-4 transition-colors duration-200 hover:bg-muted/50">
          <span className="text-muted-foreground text-sm">Sign out</span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={isSigningOut}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                {isSigningOut ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogOut className="size-4" />
                )}
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
