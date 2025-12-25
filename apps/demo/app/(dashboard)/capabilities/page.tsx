import type { Metadata } from "next";

import { ArtifactsSection } from "@/components/dashboard/capabilities/artifacts-section";
import { ChainOfThoughtSection } from "@/components/dashboard/capabilities/chain-of-thought-section";
import { ImageGenerationSection } from "@/components/dashboard/capabilities/image-generation-section";
import { MemorySection } from "@/components/dashboard/capabilities/memory-section";
import { WebSearchSection } from "@/components/dashboard/capabilities/web-search-section";

export const metadata: Metadata = {
  title: "Capabilities",
};

export default function CapabilitiesPage() {
  return (
    <div className="flex flex-1 flex-col gap-10 px-4 py-8 md:px-8">
      <div className="flex w-full max-w-3xl flex-col gap-10">
        <MemorySection />
        <ArtifactsSection />
        <ImageGenerationSection />
        <WebSearchSection />
        <ChainOfThoughtSection />
      </div>
    </div>
  );
}
