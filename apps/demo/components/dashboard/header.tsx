"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  return (
    <div className="flex h-14 items-center gap-4">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="flex items-center gap-2"
      >
        <Link href="/">
          <ArrowLeft className="mr-1 size-4" />
          <p className="font-medium">Dashboard</p>
        </Link>
      </Button>
    </div>
  );
}
