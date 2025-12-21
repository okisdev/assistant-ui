import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { database } from "@/lib/database";
import { attachment } from "@/lib/database/schema";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const chatId = formData.get("chatId") as string | null;

  const id = nanoid();
  const pathname = `attachments/${session.user.id}/${id}/${file.name}`;

  const blob = await put(pathname, file, {
    access: "public",
  });

  await database.insert(attachment).values({
    id,
    userId: session.user.id,
    chatId: chatId || null,
    url: blob.url,
    pathname: blob.pathname,
    contentType: file.type,
    size: file.size,
  });

  return Response.json({
    id,
    url: blob.url,
    pathname: blob.pathname,
  });
}
