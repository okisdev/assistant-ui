import type { Metadata } from "next";

import { SettingHeader } from "@/components/dashboard/setting-header";
import { SharesList } from "@/components/dashboard/data/shares-list";

export const metadata: Metadata = {
  title: "Shares",
};

export default function SharesPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 pt-4 pb-8 sm:gap-6 sm:py-8">
      <SettingHeader
        title="Shared Links"
        parent={{ title: "Data", href: "/data" }}
      />
      <SharesList />
    </div>
  );
}
