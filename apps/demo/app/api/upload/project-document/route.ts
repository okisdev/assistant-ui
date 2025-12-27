import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { api } from "@/utils/trpc/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api/auth";

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const projectId = formData.get("projectId") as string | null;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  if (!projectId) {
    return Response.json({ error: "No project ID provided" }, { status: 400 });
  }

  const projectData = await api.project.get({ id: projectId });
  if (!projectData) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const id = nanoid();
  const pathname = `project-documents/${user.id}/${projectId}/${id}/${file.name}`;

  const blob = await put(pathname, file, {
    access: "public",
  });

  return Response.json({
    id,
    url: blob.url,
    pathname: blob.pathname,
  });
}
