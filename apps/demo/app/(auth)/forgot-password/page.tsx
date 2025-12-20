"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Mail } from "lucide-react";

import { authClient } from "@/lib/auth.client";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!email) {
      router.replace("/login");
    }
  }, [email, router]);

  const handleSubmit = async () => {
    if (!email) return;

    setError(null);
    setIsLoading(true);

    try {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });

      if (result.error) {
        if (result.error.status === 429) {
          setError("Too many attempts. Please try again later.");
          return;
        }
        setError(result.error.message ?? "Failed to send reset email");
        return;
      }

      setIsSuccess(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-svh items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="size-6 text-primary" />
            </div>
            <h1 className="font-semibold text-2xl tracking-tight">
              Check your email
            </h1>
            <p className="text-muted-foreground text-sm">
              We&apos;ve sent a password reset link to{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-center text-muted-foreground text-sm">
              Didn&apos;t receive the email? Check your spam folder or{" "}
              <button
                type="button"
                onClick={() => setIsSuccess(false)}
                className="font-medium text-foreground hover:underline"
              >
                try again
              </button>
            </p>

            <Link href="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft />
                Back to sign in
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="font-semibold text-2xl tracking-tight">
            Reset your password
          </h1>
          <p className="text-muted-foreground text-sm">
            We&apos;ll send a password reset link to your email
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>

          <div className="rounded-lg border bg-muted/50 px-4 py-3">
            <p className="text-sm">
              <span className="text-muted-foreground">Reset password for </span>
              <span className="font-medium">{email}</span>
            </p>
          </div>
        </div>

        {error && (
          <p className="text-center text-destructive text-sm">{error}</p>
        )}

        <Button
          type="button"
          className="w-full"
          disabled={isLoading}
          onClick={handleSubmit}
        >
          {isLoading && <Loader2 className="animate-spin" />}
          Send reset link
        </Button>

        <p className="text-center text-muted-foreground text-sm">
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
