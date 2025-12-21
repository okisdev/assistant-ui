import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { ChatProvider } from "./provider";

export default async function ChatLayout(props: LayoutProps<"/">) {
  const { children } = props;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    return <ChatProvider>{children}</ChatProvider>;
  }

  return children;
}
