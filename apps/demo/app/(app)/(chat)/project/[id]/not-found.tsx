"use client";

import Link from "next/link";
import { FolderX, ArrowLeft } from "lucide-react";

import { AppLayout } from "@/components/shared/app-layout";
import { Button } from "@/components/ui/button";

export default function ProjectNotFound() {
  return (
    <AppLayout>
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-muted/50">
            <FolderX className="size-10 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <h1 className="font-semibold text-2xl tracking-tight">
              Project not found
            </h1>
            <p className="max-w-sm text-muted-foreground">
              This project doesn&apos;t exist or you don&apos;t have access to
              it.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="size-4" />
                Go home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
