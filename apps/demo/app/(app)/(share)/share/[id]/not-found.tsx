import Link from "next/link";
import { Link2Off, Home } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ShareNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-muted/50">
          <Link2Off className="size-10 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="font-semibold text-2xl tracking-tight">
            Share not found
          </h1>
          <p className="max-w-sm text-muted-foreground">
            This shared link doesn&apos;t exist or has been deleted by its
            owner.
          </p>
        </div>

        <Button asChild>
          <Link href="/">
            <Home className="size-4" />
            Go to home
          </Link>
        </Button>
      </div>
    </div>
  );
}
