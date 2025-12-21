import type {
  AttachmentAdapter,
  PendingAttachment,
  CompleteAttachment,
  Attachment,
} from "@assistant-ui/react";
import { generateId } from "ai";

export class BlobAttachmentAdapter implements AttachmentAdapter {
  public accept =
    "image/*, text/plain, text/html, text/markdown, text/csv, application/pdf";

  private uploadedUrls = new Map<string, string>();

  public async *add({
    file,
  }: {
    file: File;
  }): AsyncGenerator<PendingAttachment, void> {
    const id = generateId();
    const type = file.type.startsWith("image/") ? "image" : "file";

    let attachment: PendingAttachment = {
      id,
      type,
      name: file.name,
      contentType: file.type,
      file,
      status: { type: "running", reason: "uploading", progress: 0 },
    };
    yield attachment;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const { url } = (await response.json()) as { url: string };
      this.uploadedUrls.set(id, url);

      attachment = {
        ...attachment,
        status: { type: "requires-action", reason: "composer-send" },
      };
      yield attachment;
    } catch {
      attachment = {
        ...attachment,
        status: { type: "incomplete", reason: "error" },
      };
      yield attachment;
    }
  }

  public async remove(attachment: Attachment): Promise<void> {
    this.uploadedUrls.delete(attachment.id);
  }

  public async send(
    attachment: PendingAttachment,
  ): Promise<CompleteAttachment> {
    const url = this.uploadedUrls.get(attachment.id);
    if (!url) throw new Error("Attachment not uploaded");
    this.uploadedUrls.delete(attachment.id);

    return {
      ...attachment,
      status: { type: "complete" },
      content:
        attachment.type === "image"
          ? [{ type: "image", image: url, filename: attachment.name }]
          : [
              {
                type: "file",
                data: url,
                mimeType: attachment.contentType,
                filename: attachment.name,
              },
            ],
    };
  }
}
