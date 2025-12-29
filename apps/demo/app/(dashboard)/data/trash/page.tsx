import type { Metadata } from "next";

import { SettingHeader } from "@/components/dashboard/setting-header";
import { DeletedChatsList } from "@/components/dashboard/data/deleted-chats-list";

export const metadata: Metadata = {
  title: "Trash",
};

export default function TrashPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 pt-4 pb-8 sm:gap-6 sm:py-8">
      <SettingHeader title="Trash" parent={{ title: "Data", href: "/data" }} />
      <DeletedChatsList />
    </div>
  );
}
