import { api } from "@/utils/trpc/server";
import { ProjectChatContent } from "@/components/project/project-chat-content";

export default async function ProjectPage(props: PageProps<"/project/[id]">) {
  const { id } = await props.params;

  const project = await api.project.get({ id });

  return <ProjectChatContent projectId={id} projectName={project!.name} />;
}
