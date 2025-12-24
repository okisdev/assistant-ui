import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";

import { SettingHeader } from "@/components/dashboard/setting-header";

export const metadata: Metadata = {
  title: "Usage",
};

export default function UsagePage() {
  return (
    <div className="flex flex-1 flex-col gap-10 px-4 py-8 md:px-8">
      <div className="flex w-full max-w-3xl flex-col gap-4">
        <SettingHeader title="Usage" />

        <div className="flex flex-col items-center gap-4 rounded-lg bg-muted/50 py-12">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted/50">
            <BarChart3 className="size-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">Coming soon</p>
        </div>
      </div>
    </div>
  );
}
