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
    <div className="flex flex-1 flex-col gap-10 px-4 py-8 md:px-8">
      <div className="flex w-full flex-col gap-10">
        <div className="flex flex-col gap-4">
          <SettingHeader
            title="Memories"
            parent={{ title: "Data", href: "/data" }}
            action={<ClearAllMemoriesAction />}
          />

          <MemoriesList />
        </div>
      </div>
    </div>
  );
}
