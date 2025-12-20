"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  return (
    <div className="flex h-14 items-center gap-4">
      <Button variant="ghost" size="icon-sm" asChild>
        <Link href="/">
          <ArrowLeft className="size-4" />
        </Link>
      </Button>
      <h1 className="font-medium">Dashboard</h1>
    </div>
  );
}
