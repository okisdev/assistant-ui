import Link from "next/link";
import { MessagesSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
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

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">Sign up</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="flex w-full max-w-2xl flex-col items-center gap-8">
          <h1 className="text-center font-medium text-3xl tracking-tight">
            What can I help you with?
          </h1>

          <div className="w-full rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Ask anything..."
                className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              />
              <Button size="icon" className="shrink-0 rounded-full">
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>

          <p className="max-w-md text-center text-muted-foreground text-sm">
            This is a demo of{" "}
            <Link
              href="https://www.assistant-ui.com"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              assistant-ui
            </Link>
            , an open-source React toolkit for building AI chat experiences.
          </p>
        </div>
      </main>

      <footer className="px-6 py-4 text-center text-muted-foreground text-xs">
        Built with assistant-ui — the UX of ChatGPT in your own app.
      </footer>
    </div>
  );
}
