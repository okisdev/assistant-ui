import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { api } from "@/utils/trpc/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const projectId = formData.get("projectId") as string | null;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  if (!projectId) {
    return Response.json({ error: "No project ID provided" }, { status: 400 });
  }

  let userId: string;
  try {
    const profile = await api.user.profile.get();
    if (!profile) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = profile.id;

    const projectData = await api.project.get({ id: projectId });
    if (!projectData) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = nanoid();
  const pathname = `project-documents/${userId}/${projectId}/${id}/${file.name}`;

  const blob = await put(pathname, file, {
    access: "public",
  });

  return Response.json({
    id,
    url: blob.url,
    pathname: blob.pathname,
  });
}
