"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";

import { authClient } from "@/lib/auth.client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const error = searchParams.get("error");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (error === "INVALID_TOKEN") {
      setFormError("This reset link is invalid or has expired.");
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }

    if (!token) {
      setFormError("Invalid reset token");
      return;
    }

    setIsLoading(true);
    try {
      const result = await authClient.resetPassword({
        newPassword,
        token,
      });

      if (result.error) {
        setFormError(result.error.message || "Failed to reset password");
        return;
      }

      setIsSuccess(true);
    } catch {
      setFormError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-svh items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle className="size-6 text-emerald-500" />
            </div>
            <h1 className="font-semibold text-2xl tracking-tight">
              Password reset successful
            </h1>
            <p className="text-muted-foreground text-sm">
              Your password has been reset. You can now sign in with your new
              password.
            </p>
          </div>

          <Button className="w-full" onClick={() => router.push("/auth")}>
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  if (error === "INVALID_TOKEN" || !token) {
    return (
      <div className="flex min-h-svh items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="size-6 text-destructive" />
            </div>
            <h1 className="font-semibold text-2xl tracking-tight">
              Invalid reset link
            </h1>
            <p className="text-muted-foreground text-sm">
              This password reset link is invalid or has expired. Please request
              a new one.
            </p>
          </div>

          <Link href="/auth">
            <Button variant="outline" className="w-full">
              Back to sign in
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="font-semibold text-2xl tracking-tight">
            Set new password
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          {formError && (
            <p className="text-center text-destructive text-sm">{formError}</p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin" />}
            Reset password
          </Button>
        </form>

        <p className="text-center text-muted-foreground text-sm">
          Remember your password?{" "}
          <Link
            href="/auth"
            className="font-medium text-foreground hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
