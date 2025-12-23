import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard/nav";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardLayoutClient } from "@/components/dashboard/layout-client";

export default async function DashboardLayout(props: LayoutProps<"/">) {
  const { children } = props;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/auth");
  }

  return (
    <DashboardLayoutClient>
      <div className="mx-auto flex h-full w-full max-w-6xl flex-1 flex-col overflow-hidden px-4 pt-12">
        <DashboardHeader />
        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-48 shrink-0 py-8 md:block">
            <DashboardNav />
          </aside>
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </DashboardLayoutClient>
  );
}
