import type { Metadata } from "next";

import { ApplicationsSection } from "@/components/dashboard/integrations/applications-section";
import { MCPServerSection } from "@/components/dashboard/integrations/mcp-server-section";

export const metadata: Metadata = {
  title: "Integrations",
};

export default function IntegrationsPage() {
  return (
    <div className="flex flex-1 flex-col gap-5 pt-4 pb-8 sm:gap-8 sm:py-8">
      <ApplicationsSection />
      <MCPServerSection />
    </div>
  );
}
