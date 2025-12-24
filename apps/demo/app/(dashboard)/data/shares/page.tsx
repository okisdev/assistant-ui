import type { Metadata } from "next";

import { SettingHeader } from "@/components/dashboard/setting-header";
import { SharesList } from "@/components/dashboard/data/shares-list";

export const metadata: Metadata = {
  title: "Shares",
};

export default function SharesPage() {
  return (
    <div className="flex flex-1 flex-col gap-10 px-4 py-8 md:px-8">
      <div className="flex w-full max-w-3xl flex-col gap-10">
        <div className="flex flex-col gap-4">
          <SettingHeader
            title="Shared Links"
            parent={{ title: "Data", href: "/data" }}
          />

          <SharesList />
        </div>
      </div>
    </div>
  );
}
