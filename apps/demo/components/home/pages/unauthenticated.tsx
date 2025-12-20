import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Header } from "@/components/home/components/header";

export function HomeUnauthenticatedPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header />

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="flex w-full max-w-2xl flex-col items-center gap-8">
          <h1 className="text-center font-medium text-3xl tracking-tight">
            What can I help you with?
          </h1>

          <div className="w-full rounded-2xl bg-muted/50 p-4">
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
