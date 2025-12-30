"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

import { authClient } from "@/lib/auth.client";
import { api } from "@/utils/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { GitHub } from "@/components/icons/github";
import { Google } from "@/components/icons/google";

const emailSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

const credentialsSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .optional()
    .or(z.literal("")),
  email: z.email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type CredentialsFormValues = z.infer<typeof credentialsSchema>;

interface AuthFormContentProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function AuthForm({ onSuccess, redirectTo }: AuthFormContentProps) {
  const router = useRouter();
  const callbackURL = redirectTo || "/";
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [step, setStep] = useState<"initial" | "credentials">("initial");
  const [confirmedEmail, setConfirmedEmail] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const credentialsForm = useForm<CredentialsFormValues>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const checkEmailMutation = api.auth.checkEmailExists.useMutation();

  const handleEmailContinue = async (values: EmailFormValues) => {
    setError(null);
    setIsLoading("email");

    try {
      const result = await checkEmailMutation.mutateAsync({
        email: values.email,
      });

      setConfirmedEmail(values.email);
      credentialsForm.setValue("email", values.email);
      setIsNewUser(!result.exists);
      setStep("credentials");
    } catch (err) {
      const message =
        err instanceof Error && err.message.includes("Too many")
          ? "Too many attempts. Please try again later."
          : "Failed to check email. Please try again.";
      setError(message);
    } finally {
      setIsLoading(null);
    }
  };

  const handleBack = () => {
    setStep("initial");
    setConfirmedEmail(null);
    setError(null);
    setIsNewUser(false);
    credentialsForm.reset();
  };

  const handleSocialLogin = async (provider: "github" | "google") => {
    setError(null);
    setIsLoading(provider);

    try {
      await authClient.signIn.social({
        provider,
        callbackURL,
      });
    } catch {
      setError(`Failed to sign in with ${provider}`);
      setIsLoading(null);
    }
  };

  const handleAuthSuccess = () => {
    setIsLoading(null);
    onSuccess?.();
    router.push(callbackURL);
    router.refresh();
  };

  const handleAuthError = (error: {
    status?: number;
    code?: string;
    message?: string;
  }) => {
    setIsLoading(null);
    if (error.status === 429) {
      setError("Too many attempts. Please try again later.");
      return;
    }
    if (
      error.code === "USER_NOT_FOUND" ||
      error.message?.toLowerCase().includes("user not found")
    ) {
      setIsNewUser(true);
      setError("No account found. Please enter your name to create one.");
      return;
    }
    if (
      error.code === "INVALID_PASSWORD" ||
      error.message?.toLowerCase().includes("invalid password")
    ) {
      setError("Incorrect password. Please try again.");
      return;
    }
    if (
      error.code === "CREDENTIAL_ACCOUNT_NOT_FOUND" ||
      error.message?.toLowerCase().includes("credential")
    ) {
      setError(
        "No password set for this account. Try signing in with GitHub or Google.",
      );
      return;
    }
    setError(error.message ?? "Authentication failed");
  };

  const onSubmit = async (values: CredentialsFormValues) => {
    setError(null);
    setIsLoading("credentials");

    try {
      if (isNewUser) {
        const { data, error } = await authClient.signUp.email({
          name: values.name ?? "",
          email: values.email,
          password: values.password,
        });

        if (error) {
          handleAuthError(error);
          return;
        }

        if (!data) {
          setIsLoading(null);
          setError("Failed to create account. Please try again.");
          return;
        }
      } else {
        const { data, error } = await authClient.signIn.email({
          email: values.email,
          password: values.password,
        });

        if (error) {
          handleAuthError(error);
          return;
        }

        // If no data and no error, 2FA might be required (handled by plugin)
        if (!data) {
          setIsLoading(null);
          return;
        }
      }

      handleAuthSuccess();
    } catch (err) {
      setIsLoading(null);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="font-semibold text-xl tracking-tight">
          {isNewUser ? "Create your account" : "Continue the conversation"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isNewUser
            ? "Build AI-powered chat experiences"
            : "Your assistant is waiting"}
        </p>
      </div>

      {step === "initial" ? (
        <>
          <div className="grid gap-3">
            <Button
              variant="outline"
              className="w-full"
              disabled={!!isLoading}
              onClick={() => handleSocialLogin("github")}
            >
              {isLoading === "github" ? (
                <Loader2 className="animate-spin" />
              ) : (
                <GitHub className="size-4" />
              )}
              Continue with GitHub
            </Button>
            <Button
              variant="outline"
              className="w-full"
              disabled={!!isLoading}
              onClick={() => handleSocialLogin("google")}
            >
              {isLoading === "google" ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Google className="size-4" />
              )}
              Continue with Google
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-muted-foreground text-xs">
                or
              </span>
            </div>
          </div>

          <Form {...emailForm}>
            <form
              onSubmit={emailForm.handleSubmit(handleEmailContinue)}
              className="space-y-4"
            >
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        disabled={!!isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <p className="text-center text-destructive text-sm">{error}</p>
              )}

              <Button
                type="submit"
                variant="secondary"
                className="w-full"
                disabled={!!isLoading}
              >
                {isLoading === "email" && <Loader2 className="animate-spin" />}
                Continue with email
              </Button>
            </form>
          </Form>
        </>
      ) : (
        <>
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>

            <div className="rounded-lg bg-muted/50 px-4 py-3">
              <p className="text-sm">
                <span className="text-muted-foreground">
                  {isNewUser ? "Creating account for " : "Signing in as "}
                </span>
                <span className="font-medium">{confirmedEmail}</span>
              </p>
            </div>
          </div>

          <Form {...credentialsForm}>
            <form
              onSubmit={credentialsForm.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {isNewUser && (
                <FormField
                  control={credentialsForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your name"
                          autoComplete="name"
                          autoFocus
                          disabled={!!isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={credentialsForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      {!isNewUser && confirmedEmail && (
                        <Link
                          href={`/forgot-password?email=${encodeURIComponent(confirmedEmail)}`}
                          className="text-muted-foreground text-sm hover:text-foreground"
                        >
                          Forgot?
                        </Link>
                      )}
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete={
                          isNewUser ? "new-password" : "current-password"
                        }
                        autoFocus={!isNewUser}
                        disabled={!!isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <p className="text-center text-destructive text-sm">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={!!isLoading}>
                {isLoading === "credentials" && (
                  <Loader2 className="animate-spin" />
                )}
                {isNewUser ? "Create account" : "Sign in"}
              </Button>

              {isNewUser && (
                <p className="text-center text-muted-foreground text-sm">
                  Not your email?{" "}
                  <button
                    type="button"
                    onClick={handleBack}
                    className="font-medium text-foreground hover:underline"
                  >
                    Go back
                  </button>
                </p>
              )}
            </form>
          </Form>
        </>
      )}
    </div>
  );
}
