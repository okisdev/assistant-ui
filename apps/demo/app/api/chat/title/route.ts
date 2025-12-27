import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api/auth";

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const { messages } = await req.json();

  const userMessage = messages.find((m: { role: string }) => m.role === "user");
  const assistantMessage = messages.find(
    (m: { role: string }) => m.role === "assistant",
  );

  if (!userMessage) {
    return Response.json({ title: "New Chat" });
  }

  const userText =
    userMessage.content?.[0]?.text || userMessage.content || "New Chat";
  const assistantText =
    assistantMessage?.content?.[0]?.text || assistantMessage?.content || "";

  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: `Generate a very short title (3-6 words) for this conversation. Return only the title, no quotes or punctuation.`,
      prompt: `User: ${userText}\n${assistantText ? `Assistant: ${assistantText}` : ""}`,
    });

    return Response.json({ title: text.trim() });
  } catch {
    const fallbackTitle = userText.split(" ").slice(0, 5).join(" ");
    return Response.json({
      title:
        fallbackTitle.length > 30
          ? `${fallbackTitle.slice(0, 30)}...`
          : fallbackTitle,
    });
  }
}
