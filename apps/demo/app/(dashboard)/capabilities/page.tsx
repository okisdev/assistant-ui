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
    <div className="flex flex-1 flex-col gap-5 pt-4 pb-8 sm:gap-8 sm:py-8">
      <MemorySection />
      <ArtifactsSection />
      <ImageGenerationSection />
      <WebSearchSection />
      <ChainOfThoughtSection />
    </div>
  );
}
