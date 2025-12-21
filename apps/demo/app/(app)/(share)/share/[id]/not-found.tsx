import Link from "next/link";
import { Link2Off, MessagesSquare, ArrowRight } from "lucide-react";

export default function ShareNotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
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
          <div className="flex size-16 items-center justify-center rounded-full bg-muted/50">
            <Link2Off className="size-7 text-muted-foreground" />
          </div>

          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="font-medium text-xl">Link not found</h1>
            <p className="max-w-sm text-muted-foreground text-sm">
              This shared link doesn&apos;t exist or has been removed.
            </p>
          </div>

          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm transition-colors hover:text-foreground"
          >
            Start a new chat
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
