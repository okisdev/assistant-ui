import type { Metadata } from "next";

import { SettingHeader } from "@/components/dashboard/setting-header";
import { ArchivedChatsList } from "@/components/dashboard/data/archived-chats-list";

export const metadata: Metadata = {
  title: "Archives",
};

export default function ArchivesPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 pt-4 pb-8 sm:gap-6 sm:py-8">
      <SettingHeader
        title="Archives"
        parent={{ title: "Data", href: "/data" }}
      />
      <ArchivedChatsList />
    </div>
  );
}
