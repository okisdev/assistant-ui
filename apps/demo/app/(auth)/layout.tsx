import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";

export default async function AuthLayout(props: LayoutProps<"/">) {
  const { children } = props;

  const session = await getSession();

  if (session) {
    return redirect("/");
  }

  return (
    <div className="relative min-h-svh">
      <header className="absolute top-0 left-0 px-6 py-5.5">
        <Link href="/" className="flex items-center gap-2">
          <MessagesSquare className="size-5" strokeWidth={3} />
          <span className="font-medium text-sm">assistant-ui demo</span>
        </Link>
      </header>
      {children}
    </div>
  );
}
