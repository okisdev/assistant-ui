import type { UserContext } from "./context";

export const SAVE_MEMORY_INSTRUCTIONS = `You have the ability to remember information about the user using the save_memory tool.

When the user shares personal information, preferences, or anything they might want you to remember, use the save_memory tool to store it. This includes:
- Their name or personal details
- Preferences and interests
- Goals or projects
- Important context

Be proactive about saving memories - if the user mentions something significant, save it without being asked.`;

export const ARTIFACT_INSTRUCTIONS = `You have the ability to create interactive artifacts using the create_artifact tool.

When the user asks you to create, build, or generate something visual or interactive (like a website, app, calculator, game, chart, or any interactive component), use the create_artifact tool to generate it.

Guidelines for creating artifacts:
- Create complete, self-contained HTML documents with embedded CSS and JavaScript
- Use modern CSS features (flexbox, grid, CSS variables)
- Add interactivity with vanilla JavaScript when appropriate
- Make designs visually appealing with proper spacing, colors, and typography
- Ensure the artifact is responsive and works on different screen sizes
- Include all necessary styles inline or in a <style> tag
- For complex interactions, include all JavaScript in a <script> tag

Examples of what to create as artifacts:
- Landing pages and website mockups
- Interactive calculators and converters
- Data visualizations and charts
- Simple games (tic-tac-toe, memory game, etc.)
- Form layouts and UI components
- Countdown timers and clocks
- Todo lists and productivity tools`;

function formatUserInfo(
  profile: {
    name: string;
    nickname: string | null;
    workType: string | null;
  } | null,
): string {
  if (!profile) return "";

  const parts: string[] = [];
  const displayName = profile.nickname || profile.name;
  parts.push(`- Name: ${displayName}`);

  if (profile.workType) {
    parts.push(`- Work type: ${profile.workType}`);
  }

  return `## User Profile
${parts.join("\n")}`;
}

function formatMemories(
  memories: Array<{ content: string; category: string | null }>,
): string {
  if (memories.length === 0) return "";

  const lines = memories.map((m) => {
    const category = m.category ? `[${m.category}] ` : "";
    return `- ${category}${m.content}`;
  });

  return `## User Memories
Important information from previous conversations:
${lines.join("\n")}`;
}

export function buildSystemPrompt(context: UserContext): string {
  const parts: string[] = [];

  if (context.projectContext?.instructions) {
    parts.push(
      `## Project Instructions\n${context.projectContext.instructions}`,
    );
  }

  if (context.capabilities.personalization) {
    parts.push(SAVE_MEMORY_INSTRUCTIONS);
  }

  if (context.capabilities.artifacts) {
    parts.push(ARTIFACT_INSTRUCTIONS);
  }

  const userInfo = formatUserInfo(context.profile);
  if (userInfo) {
    parts.push(userInfo);
  }

  const memoriesText = formatMemories(context.memories);
  if (memoriesText) {
    parts.push(memoriesText);
  }

  if (
    context.projectContext?.documents &&
    context.projectContext.documents.length > 0
  ) {
    parts.push(
      `## Project Knowledge Base\nThe following documents are available as reference:\n\n${context.projectContext.documents.join("\n\n")}`,
    );
  }

  return parts.join("\n\n");
}
