"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { authClient } from "@/lib/auth.client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Verify2FAPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code) {
      setError("Please enter a code");
      return;
    }

    setIsLoading(true);
    try {
      const result = useBackupCode
        ? await authClient.twoFactor.verifyBackupCode({
            code,
            trustDevice: true,
          })
        : await authClient.twoFactor.verifyTotp({
            code,
            trustDevice: true,
          });

      if (result.error) {
        setError(result.error.message || "Invalid code");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="size-6 text-primary" />
          </div>
          <h1 className="font-semibold text-2xl tracking-tight">
            Two-Factor Authentication
          </h1>
          <p className="text-muted-foreground text-sm">
            {useBackupCode
              ? "Enter one of your backup codes"
              : "Enter the 6-digit code from your authenticator app"}
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">
              {useBackupCode ? "Backup Code" : "Verification Code"}
            </Label>
            <Input
              id="code"
              type="text"
              inputMode={useBackupCode ? "text" : "numeric"}
              pattern={useBackupCode ? undefined : "[0-9]*"}
              maxLength={useBackupCode ? 20 : 6}
              value={code}
              onChange={(e) =>
                setCode(
                  useBackupCode
                    ? e.target.value
                    : e.target.value.replace(/\D/g, ""),
                )
              }
              placeholder={useBackupCode ? "Enter backup code" : "000000"}
              className={
                useBackupCode
                  ? "font-mono"
                  : "text-center font-mono text-lg tracking-widest"
              }
              autoComplete="one-time-code"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-center text-destructive text-sm">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !code}
          >
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Verify
          </Button>
        </form>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setCode("");
              setError(null);
            }}
            className="w-full text-center text-muted-foreground text-sm hover:text-foreground"
          >
            {useBackupCode
              ? "Use authenticator app instead"
              : "Use a backup code instead"}
          </button>

          <Link href="/auth">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 size-4" />
              Back to sign in
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
