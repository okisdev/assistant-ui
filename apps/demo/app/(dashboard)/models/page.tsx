import type { Metadata } from "next";

import { ModelsSection } from "@/components/dashboard/models/models-section";

export const metadata: Metadata = {
  title: "Models",
};

export default function ModelsPage() {
  return (
    <div className="flex flex-1 flex-col pt-4 pb-8 sm:py-8">
      <ModelsSection />
    </div>
  );
}
