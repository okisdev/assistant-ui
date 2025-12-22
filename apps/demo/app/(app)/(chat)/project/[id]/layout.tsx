import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { api } from "@/utils/trpc/server";

export default async function ProjectLayout(
  props: LayoutProps<"/project/[id]">,
) {
  const { id } = await props.params;
  const { children } = props;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(`/auth?redirect=${encodeURIComponent(`/project/${id}`)}`);
  }

  const project = await api.project.get({ id });

  if (!project) {
    notFound();
  }

  return children;
}
