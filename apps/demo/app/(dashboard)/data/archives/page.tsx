import { SettingHeader } from "@/components/dashboard/setting-header";
import { ArchivedChatsList } from "@/components/dashboard/data/archived-chats-list";

export default function ArchivesPage() {
  return (
    <div className="flex flex-1 flex-col gap-10 px-4 py-8 md:px-8">
      <div className="flex w-full max-w-3xl flex-col gap-10">
        <div className="flex flex-col gap-4">
          <SettingHeader
            title="Archives"
            parent={{ title: "Data", href: "/data" }}
          />

          <ArchivedChatsList />
        </div>
      </div>
    </div>
  );
}
