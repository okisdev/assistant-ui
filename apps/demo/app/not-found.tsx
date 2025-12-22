import Link from "next/link";
import { Compass, MessagesSquare, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <MessagesSquare className="size-4" strokeWidth={2.5} />
            <span className="text-sm">assistant-ui</span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center gap-6">
          <div className="flex size-20 items-center justify-center rounded-full bg-muted/50">
            <Compass className="size-10 text-muted-foreground" />
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <p className="font-mono text-muted-foreground text-sm">404</p>
            <h1 className="font-semibold text-2xl tracking-tight">
              Page not found
            </h1>
            <p className="max-w-sm text-muted-foreground">
              The page you&apos;re looking for doesn&apos;t exist or has been
              moved.
            </p>
          </div>

          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm transition-colors hover:text-foreground"
          >
            Back to home
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </main>

      <footer className="px-6 py-4 text-center text-muted-foreground text-xs">
        Built with assistant-ui — the UX of ChatGPT in your own app.
      </footer>
    </div>
  );
}
