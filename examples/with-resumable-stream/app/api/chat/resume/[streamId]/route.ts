import { getStreamContext } from "../../route";

export const maxDuration = 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ streamId: string }> },
) {
  const { streamId } = await params;

  const streamContext = getStreamContext();

  const stream = await streamContext.resumeStream(streamId);

  if (!stream) {
    return new Response(
      JSON.stringify({ error: "Stream not found or completed" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return streamContext.createResponse(streamId, stream);
}
