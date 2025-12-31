import { nanoid } from "nanoid";
import { put } from "@vercel/blob";

import { api } from "@/utils/trpc/server";
import { getSession } from "@/lib/auth";
import { AUIError } from "@/lib/error";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return AUIError.unauthorized().toResponse();
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const projectId = formData.get("projectId") as string | null;

  if (!file) {
    return AUIError.badRequest("No file provided").toResponse();
  }

  if (!projectId) {
    return AUIError.badRequest("No project ID provided").toResponse();
  }

  const projectData = await api.project.get({ id: projectId });
  if (!projectData) {
    return AUIError.notFound("Project not found").toResponse();
  }

  const id = nanoid();
  const pathname = `project-documents/${session.user.id}/${projectId}/${id}/${file.name}`;

  const blob = await put(pathname, file, {
    access: "public",
  });

  return Response.json({
    id,
    url: blob.url,
    pathname: blob.pathname,
  });
}
