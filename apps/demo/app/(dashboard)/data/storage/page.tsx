import type { Metadata } from "next";

import { SettingHeader } from "@/components/dashboard/setting-header";
import { StorageUsage } from "@/components/dashboard/data/storage-usage";

export const metadata: Metadata = {
  title: "Storage",
};

export default function StoragePage() {
  return (
    <div className="flex flex-1 flex-col gap-10 px-4 py-8 md:px-8">
      <div className="flex w-full flex-col gap-10">
        <div className="flex flex-col gap-4">
          <SettingHeader
            title="Storage"
            parent={{ title: "Data", href: "/data" }}
          />

          <StorageUsage />
        </div>
      </div>
    </div>
  );
}
