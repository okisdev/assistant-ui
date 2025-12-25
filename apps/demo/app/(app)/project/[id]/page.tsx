import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { api } from "@/utils/trpc/server";
import { ProjectIdContent } from "@/components/app/project/id/content";

export async function generateMetadata(
  props: PageProps<"/project/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const project = await api.project.get({ id });

  return {
    title: project?.name || "Project",
  };
}

export default async function ProjectPage(props: PageProps<"/project/[id]">) {
  const { id } = await props.params;

  const project = await api.project.get({ id });

  if (!project) {
    notFound();
  }

  return <ProjectIdContent projectId={id} projectName={project.name} />;
}
