import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

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

  if (!file) {
    return AUIError.badRequest("No file provided").toResponse();
  }

  const chatId = formData.get("chatId") as string | null;

  const id = nanoid();
  const pathname = `attachments/${session.user.id}/${id}/${file.name}`;

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
