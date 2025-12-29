"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  return (
    <div className="-ml-2 flex h-12 items-center sm:h-14 md:ml-0">
      <Button variant="ghost" size="sm" asChild className="px-3">
        <Link href="/">
          <ArrowLeft className="size-4" />
          <span className="font-medium">Dashboard</span>
        </Link>
      </Button>
    </div>
  );
}
