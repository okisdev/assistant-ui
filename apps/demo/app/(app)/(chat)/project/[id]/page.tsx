import { api } from "@/utils/trpc/server";
import { ProjectIdContent } from "@/components/app/project/id/content";
import { notFound } from "next/navigation";

export default async function ProjectPage(props: PageProps<"/project/[id]">) {
  const { id } = await props.params;

  const project = await api.project.get({ id });

  if (!project) {
    notFound();
  }

  return <ProjectIdContent projectId={id} projectName={project.name} />;
}
