import { HardDrive, Archive, Share2, Trash, Download } from "lucide-react";

import { SettingHeader } from "@/components/dashboard/setting-header";
import {
  SettingRowLink,
  SettingRowStatic,
} from "@/components/dashboard/setting-row";

export default function DataPage() {
  return (
    <div className="flex flex-1 flex-col gap-10 px-4 py-8 md:px-8">
      <div className="flex w-full max-w-3xl flex-col gap-10">
        <div className="flex flex-col gap-4">
          <SettingHeader title="Data" />

          <div className="flex flex-col gap-2">
            <SettingRowLink
              icon={HardDrive}
              title="Storage"
              description="View your storage usage and uploaded files"
              href="/data/storage"
            />
            <SettingRowLink
              icon={Archive}
              title="Archives"
              description="View and manage your archived chats"
              href="/data/archives"
            />
            <SettingRowLink
              icon={Share2}
              title="Shared Links"
              description="Manage your shared chat links"
              href="/data/shares"
            />
            <SettingRowLink
              icon={Trash}
              title="Trash"
              description="View and restore deleted chats"
              href="/data/trash"
            />
            <SettingRowStatic
              icon={Download}
              title="Export"
              description="Download all your data"
              badge="Coming soon"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
