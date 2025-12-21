import { AuthForm } from "@/components/auth/form";

export default async function AuthPage(props: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const searchParams = await props.searchParams;
  const redirectTo = searchParams.redirect;

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <AuthForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
