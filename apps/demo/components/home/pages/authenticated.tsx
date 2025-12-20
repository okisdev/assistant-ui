"use client";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/shared/app-layout";

export function HomeAuthenticatedPage() {
  return (
    <AppLayout>
      <div className="flex flex-1 flex-col items-center justify-center px-4">
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
        </div>
      </div>
    </AppLayout>
  );
}
