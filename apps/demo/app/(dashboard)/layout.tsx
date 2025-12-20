import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AppLayout } from "@/components/shared/app-layout";
import { DashboardNav } from "@/components/dashboard/nav";
import { DashboardHeader } from "@/components/dashboard/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/auth");
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4">
        <DashboardHeader />
        <div className="flex flex-1">
          <aside className="hidden w-48 shrink-0 py-8 md:block">
            <DashboardNav />
          </aside>
          <main className="flex flex-1 flex-col">{children}</main>
        </div>
      </div>
    </AppLayout>
  );
}
