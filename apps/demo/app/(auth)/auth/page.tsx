import { AuthForm } from "@/components/auth/form";

export default function AuthPage() {
  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <AuthForm />
      </div>
    </div>
  );
}
