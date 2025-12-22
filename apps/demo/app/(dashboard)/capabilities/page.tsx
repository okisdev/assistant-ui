import { ArtifactsSection } from "@/components/dashboard/capabilities/artifacts-section";
import { MemorySection } from "@/components/dashboard/capabilities/memory-section";

export default function CapabilitiesPage() {
  return (
    <div className="flex flex-1 flex-col gap-10 px-4 py-8 md:px-8">
      <div className="flex w-full max-w-3xl flex-col gap-10">
        <MemorySection />
        <ArtifactsSection />
      </div>
    </div>
  );
}
