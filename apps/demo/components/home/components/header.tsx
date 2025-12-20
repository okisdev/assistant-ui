import Link from "next/link";
import { MessagesSquare } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4">
      <Link href="/" className="flex items-center gap-2">
        <MessagesSquare className="size-5" strokeWidth={3} />
        <span className="font-medium text-sm">assistant-ui demo</span>
      </Link>

      <nav className="hidden items-center gap-6 text-muted-foreground text-sm md:flex">
        <Link
          href="https://www.assistant-ui.com/docs"
          className="transition-colors hover:text-foreground"
        >
          Docs
        </Link>
        <Link
          href="https://github.com/assistant-ui/assistant-ui"
          className="transition-colors hover:text-foreground"
        >
          GitHub
        </Link>
        <Link
          href="https://www.assistant-ui.com"
          className="transition-colors hover:text-foreground"
        >
          Website
        </Link>
      </nav>

      <Button size="sm" asChild>
        <Link href="/auth">Get started</Link>
      </Button>
    </header>
  );
}
