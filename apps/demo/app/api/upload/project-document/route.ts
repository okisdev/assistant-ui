import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { database } from "@/lib/database";
import { project } from "@/lib/database/schema";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
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

  // Verify user owns the project
  const projectResult = await database
    .select({ id: project.id })
    .from(project)
    .where(and(eq(project.id, projectId), eq(project.userId, session.user.id)))
    .limit(1);

  if (!projectResult[0]) {
    return Response.json({ error: "Project not found" }, { status: 404 });
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
