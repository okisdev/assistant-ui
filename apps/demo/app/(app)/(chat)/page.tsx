import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { HomeUnauthenticatedPage } from "@/components/home/pages/unauthenticated";

export default async function ChatHome() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // For authenticated users, UI is rendered by ChatContent in the provider
  // This page just needs to exist to handle the route
  if (session?.user) {
    return null;
  }

  return <HomeUnauthenticatedPage />;
}
