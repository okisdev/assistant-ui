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

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const chatId = formData.get("chatId") as string | null;

  const id = nanoid();
  const pathname = `attachments/${user.id}/${id}/${file.name}`;

  const blob = await put(pathname, file, {
    access: "public",
  });

  await api.attachment.create({
    id,
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
