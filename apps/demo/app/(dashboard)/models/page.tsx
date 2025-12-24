import type { Metadata } from "next";

import { ModelsSection } from "@/components/dashboard/models/models-section";

export const metadata: Metadata = {
  title: "Models",
};

export default function ModelsPage() {
  return (
    <div className="flex flex-1 flex-col gap-10 px-4 py-8 md:px-8">
      <div className="flex w-full max-w-3xl flex-col gap-10">
        <ModelsSection />
      </div>
    </div>
  );
}
