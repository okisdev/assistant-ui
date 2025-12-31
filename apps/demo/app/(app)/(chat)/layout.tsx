import { getSession } from "@/lib/auth";
import { ChatUI } from "./provider";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (session?.user) {
    return (
      <>
        <ChatUI />
        {children}
      </>
    );
  }

  return children;
}
