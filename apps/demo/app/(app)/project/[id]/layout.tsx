import { notFound, redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { api } from "@/utils/trpc/server";

export default async function ProjectLayout(
  props: LayoutProps<"/project/[id]">,
) {
  const { id } = await props.params;
  const { children } = props;

  const session = await getSession();

  if (!session) {
    redirect(`/auth?redirect=${encodeURIComponent(`/project/${id}`)}`);
  }

  const project = await api.project.get({ id });

  if (!project) {
    notFound();
  }

  return children;
}
