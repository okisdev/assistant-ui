import { AppearanceSection } from "@/components/dashboard/general/appearance-section";
import { ProfileSection } from "@/components/dashboard/general/profile-section";

export default function GeneralPage() {
  return (
    <div className="flex flex-1 flex-col gap-10 px-4 py-8 md:px-8">
      <div className="flex w-full max-w-2xl flex-col gap-10">
        <ProfileSection />
        <AppearanceSection />
      </div>
    </div>
  );
}
