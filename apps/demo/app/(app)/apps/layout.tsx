import type { ReactNode } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { AppLayout } from "@/components/shared/app-layout";

export const metadata: Metadata = {
  title: "Apps",
};

export default async function AppsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    return redirect("/auth");
  }

  return <AppLayout>{children}</AppLayout>;
}
