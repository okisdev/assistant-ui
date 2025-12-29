import type { Metadata } from "next";

import { SettingHeader } from "@/components/dashboard/setting-header";
import { StorageUsage } from "@/components/dashboard/data/storage-usage";

export const metadata: Metadata = {
  title: "Storage",
};

export default function StoragePage() {
  return (
    <div className="flex flex-1 flex-col gap-4 pt-4 pb-8 sm:gap-6 sm:py-8">
      <SettingHeader
        title="Storage"
        parent={{ title: "Data", href: "/data" }}
      />
      <StorageUsage />
    </div>
  );
}
