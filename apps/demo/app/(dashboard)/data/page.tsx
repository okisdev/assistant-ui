import type { Metadata } from "next";
import {
  HardDrive,
  Archive,
  Share2,
  Trash,
  Download,
  Brain,
} from "lucide-react";

import { SettingHeader } from "@/components/dashboard/setting-header";
import {
  SettingRowLink,
  SettingRowStatic,
} from "@/components/dashboard/setting-row";

export const metadata: Metadata = {
  title: "Data",
};

export default function DataPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 pt-4 pb-8 sm:gap-6 sm:py-8">
      <SettingHeader title="Data" />

      <div className="flex flex-col gap-2">
        <SettingRowLink
          icon={HardDrive}
          title="Storage"
          description="View your storage usage and uploaded files"
          href="/data/storage"
        />
        <SettingRowLink
          icon={Brain}
          title="Memories"
          description="View and manage AI memories about you"
          href="/data/memories"
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
  );
}
