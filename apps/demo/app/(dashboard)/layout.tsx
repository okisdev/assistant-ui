import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { DashboardNav, DashboardNavMobile } from "@/components/dashboard/nav";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardLayoutClient } from "@/components/dashboard/layout-client";

export default async function DashboardLayout(props: LayoutProps<"/">) {
  const { children } = props;

  const session = await getSession();

  if (!session) {
    return redirect("/auth");
  }

  return (
    <DashboardLayoutClient>
      <div className="mx-auto flex h-full w-full max-w-5xl flex-1 flex-col overflow-hidden px-4 pt-12">
        <DashboardHeader />
        <div className="md:hidden">
          <DashboardNavMobile />
        </div>
        <div className="flex min-h-0 flex-1 gap-8">
          <aside className="hidden w-44 shrink-0 py-8 md:block">
            <DashboardNav />
          </aside>
          <main className="scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </DashboardLayoutClient>
  );
}
