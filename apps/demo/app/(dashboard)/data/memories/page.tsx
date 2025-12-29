import type { Metadata } from "next";

import { SettingHeader } from "@/components/dashboard/setting-header";
import {
  MemoriesList,
  ClearAllMemoriesAction,
} from "@/components/dashboard/data/memories-list";

export const metadata: Metadata = {
  title: "Memories",
};

export default function MemoriesPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 pt-4 pb-8 sm:gap-6 sm:py-8">
      <SettingHeader
        title="Memories"
        parent={{ title: "Data", href: "/data" }}
        action={<ClearAllMemoriesAction />}
      />
      <MemoriesList />
    </div>
  );
}
