import type { Metadata } from "next";

import { ApplicationsSection } from "@/components/dashboard/integrations/applications-section";
import { MCPServerSection } from "@/components/dashboard/integrations/mcp-server-section";

export const metadata: Metadata = {
  title: "Integrations",
};

export default function IntegrationsPage() {
  return (
    <div className="flex flex-1 flex-col gap-10 px-4 py-8 md:px-8">
      <div className="flex w-full flex-col gap-10">
        <ApplicationsSection />
        <MCPServerSection />
      </div>
    </div>
  );
}
