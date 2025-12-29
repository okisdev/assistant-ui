import type { Metadata } from "next";

import { AppearanceSection } from "@/components/dashboard/general/appearance-section";
import { ProfileSection } from "@/components/dashboard/general/profile-section";

export const metadata: Metadata = {
  title: "General",
};

export default function GeneralPage() {
  return (
    <div className="flex flex-1 flex-col gap-5 pt-4 pb-8 sm:gap-8 sm:py-8">
      <ProfileSection />
      <AppearanceSection />
    </div>
  );
}
