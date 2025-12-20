"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";

import { authClient } from "@/lib/auth.client";
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
  email: z.string().email("Please enter a valid email address"),
});

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState<string | null>(null);

  const isLogin = mode === "login";

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const credentialsForm = useForm<LoginFormValues | RegisterFormValues>({
    resolver: zodResolver(isLogin ? loginSchema : registerSchema),
    defaultValues: isLogin
      ? { email: "", password: "" }
      : { name: "", email: "", password: "" },
  });

  const handleEmailContinue = (values: EmailFormValues) => {
    setConfirmedEmail(values.email);
    credentialsForm.setValue("email", values.email);
    setShowPassword(true);
  };

  const handleBack = () => {
    setShowPassword(false);
    setConfirmedEmail(null);
    setError(null);
  };

  const handleSocialLogin = async (provider: "github" | "google") => {
    setError(null);
    setIsLoading(provider);

    try {
      await authClient.signIn.social({
        provider,
        callbackURL: "/",
      });
    } catch {
      setError(`Failed to sign in with ${provider}`);
      setIsLoading(null);
    }
  };

  const onSubmit = async (values: LoginFormValues | RegisterFormValues) => {
    setError(null);
    setIsLoading("credentials");

    try {
      if (isLogin) {
        const { email, password } = values as LoginFormValues;
        const result = await authClient.signIn.email({
          email,
          password,
        });

        if (result.error) {
          setError(result.error.message ?? "Failed to sign in");
          return;
        }
      } else {
        const { name, email, password } = values as RegisterFormValues;
        const result = await authClient.signUp.email({
          name,
          email,
          password,
        });

        if (result.error) {
          setError(result.error.message ?? "Failed to create account");
          return;
        }
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="font-semibold text-2xl tracking-tight">
            {isLogin ? "Continue the conversation" : "Start the conversation"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isLogin
              ? "Your assistant is waiting"
              : "Build AI-powered chat experiences"}
          </p>
        </div>

        {!showPassword ? (
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
                  <p className="text-center text-destructive text-sm">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full"
                  disabled={!!isLoading}
                >
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

              <div className="rounded-lg border bg-muted/50 px-4 py-3">
                <p className="text-sm">
                  <span className="text-muted-foreground">
                    {isLogin ? "Signing in as " : "Creating account for "}
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
                {!isLogin && (
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
                        {isLogin && confirmedEmail && (
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
                            isLogin ? "current-password" : "new-password"
                          }
                          autoFocus={isLogin}
                          disabled={!!isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <p className="text-center text-destructive text-sm">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={!!isLoading}>
                  {isLoading === "credentials" && (
                    <Loader2 className="animate-spin" />
                  )}
                  {isLogin ? "Sign in" : "Create account"}
                </Button>
              </form>
            </Form>
          </>
        )}

        <p className="text-center text-muted-foreground text-sm">
          {isLogin ? (
            <>
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-foreground hover:underline"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-foreground hover:underline"
              >
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
