import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { HomeAuthenticatedPage } from "@/components/home/pages/authenticated";
import { HomeUnauthenticatedPage } from "@/components/home/pages/unauthenticated";

export default async function ChatHome() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    return <HomeAuthenticatedPage />;
  }

  return <HomeUnauthenticatedPage />;
}
