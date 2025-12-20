import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    return redirect("/");
  }

  return (
    <div className="relative min-h-svh">
      <header className="absolute top-0 left-0 p-6">
        <Link href="/" className="flex items-center gap-2">
          <MessagesSquare className="size-5" strokeWidth={3} />
          <span className="font-medium text-sm">assistant-ui demo</span>
        </Link>
      </header>
      {children}
    </div>
  );
}
