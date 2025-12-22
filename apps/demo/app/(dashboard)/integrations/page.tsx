import { IntegrationsSection } from "@/components/dashboard/integrations/integrations-section";

export default function IntegrationsPage() {
  return (
    <div className="flex flex-1 flex-col gap-10 px-4 py-8 md:px-8">
      <div className="flex w-full max-w-3xl flex-col gap-10">
        <IntegrationsSection />
      </div>
    </div>
  );
}
