import type { UserContext } from "./context";
import type { MCPToolInfo } from "./mcp";
import { getBuiltinApp } from "@/lib/integrations/apps";

export const SAVE_MEMORY_INSTRUCTIONS = `<memory_capability>
<tool>save_memory</tool>
<purpose>Remember important information about the user across conversations to provide personalized assistance.</purpose>

<when_to_save>
Save memories when the user shares:
- Personal details (name, role, location)
- Preferences and interests
- Goals, projects, or ongoing work
- Important context they'd want you to remember
</when_to_save>

<behavior>
Be proactive: if the user mentions something significant, save it without being asked. This creates a more personalized and helpful experience over time.
</behavior>
</memory_capability>`;

export const ARTIFACT_INSTRUCTIONS = `<artifact_capability>
<tool>create_artifact</tool>
<purpose>Create interactive visual content that renders in a preview panel, providing an immediate hands-on experience for the user.</purpose>

<when_to_use>
Use create_artifact when the user asks to create, build, or generate:
- Websites, landing pages, or mockups
- Interactive calculators or converters
- Interactive data visualizations or charts (D3.js, Chart.js, etc.)
- Simple games (tic-tac-toe, memory, etc.)
- Form layouts or UI components
- Countdown timers, clocks, or productivity tools
</when_to_use>

<when_not_to_use>
Do NOT use create_artifact for:
- Mermaid diagrams (use \`\`\`mermaid code blocks instead - they render natively)
- Simple static diagrams that can be expressed in text/mermaid
- Code examples or snippets (use regular code blocks)
- Text-based content like documentation
</when_not_to_use>

<guidelines>
<technical>
- Create complete, self-contained HTML documents
- Embed CSS in a style tag and JavaScript in a script tag
- Use modern CSS (flexbox, grid, CSS variables)
- Ensure responsive design for different screen sizes
</technical>

<design>
- Make designs visually appealing with proper spacing and typography
- Choose cohesive color schemes
- Add interactivity with vanilla JavaScript when appropriate
- Focus on user experience and usability
</design>
</guidelines>
</artifact_capability>`;

export const AUTO_COT_INSTRUCTIONS = `<chain_of_thought>
<purpose>
Step-by-step reasoning improves accuracy and helps catch errors. Use <thinking> tags to show your reasoning process before providing answers.
</purpose>

<instruction>
Before answering, think through the problem in <thinking> tags. This applies to most questions including:
- Any question requiring calculation or analysis
- Questions with multiple parts or considerations
- Technical questions about code, systems, or processes
- Questions requiring comparison or evaluation
- Creative tasks that benefit from planning

Only skip <thinking> for truly trivial responses like greetings or single-fact lookups.
</instruction>

<format>
<thinking>
[Your reasoning process - break down the problem, consider factors, reach conclusion]
</thinking>

[Your final answer]
</format>

<example>
User: What's 15% of 80?

<thinking>
1. Convert 15% to decimal: 0.15
2. Multiply: 0.15 × 80 = 12
</thinking>

The answer is **12**.
</example>
</chain_of_thought>`;

export const ALWAYS_COT_INSTRUCTIONS = `<chain_of_thought>
<purpose>
You must always think step-by-step before answering. This is a strict requirement.
</purpose>

<instruction>
ALWAYS begin your response with <thinking> tags. No exceptions.

Think before you answer in <thinking> tags, then provide your response after </thinking>.
</instruction>

<format>
<thinking>
[Your step-by-step reasoning - required for EVERY response]
</thinking>

[Your final answer]
</format>

<examples>
<example>
User: What's 15% of 80?

<thinking>
1. Convert percentage to decimal: 15% = 0.15
2. Multiply by the value: 0.15 × 80 = 12
</thinking>

The answer is **12**.
</example>

<example>
User: Hello, how are you?

<thinking>
The user is greeting me. I should respond warmly and offer to help.
</thinking>

Hello! I'm doing well, thank you for asking. How can I help you today?
</example>
</examples>

<reminder>
You MUST include <thinking> tags in EVERY response. This is mandatory.
</reminder>
</chain_of_thought>`;

function formatUserInfo(
  profile: {
    name: string;
    nickname: string | null;
    workType: string | null;
  } | null,
): string {
  if (!profile) return "";

  const displayName = profile.nickname || profile.name;
  const parts: string[] = [`<name>${displayName}</name>`];

  if (profile.workType) {
    parts.push(`<work_type>${profile.workType}</work_type>`);
  }

  return `<user_profile>
${parts.join("\n")}
</user_profile>`;
}

function formatMemories(
  memories: Array<{ content: string; category: string | null }>,
): string {
  if (memories.length === 0) return "";

  const lines = memories.map((m) => {
    if (m.category) {
      return `<memory category="${m.category}">${m.content}</memory>`;
    }
    return `<memory>${m.content}</memory>`;
  });

  return `<user_memories>
${lines.join("\n")}
</user_memories>`;
}

function formatMCPTools(toolInfos: MCPToolInfo[]): string {
  if (toolInfos.length === 0) return "";

  const byServer = toolInfos.reduce(
    (acc, tool) => {
      if (!acc[tool.serverName]) {
        acc[tool.serverName] = [];
      }
      acc[tool.serverName].push(tool);
      return acc;
    },
    {} as Record<string, MCPToolInfo[]>,
  );

  const serverBlocks = Object.entries(byServer).map(([serverName, tools]) => {
    const toolLines = tools
      .map(
        (t) =>
          `  <tool name="${t.prefixedName}">${t.description || t.toolName}</tool>`,
      )
      .join("\n");
    return `<server name="${serverName}">\n${toolLines}\n</server>`;
  });

  return `<mcp_tools>
<purpose>You have access to external tools from MCP (Model Context Protocol) servers. Use these tools when the user's request matches their capabilities.</purpose>
<available_servers>
${serverBlocks.join("\n")}
</available_servers>
<instruction>When a user asks about something that could be handled by an MCP tool, use the appropriate tool based on its description. The tool names are prefixed with "mcp_" followed by the server name. Follow the tool descriptions to understand the correct workflow and parameters.</instruction>
</mcp_tools>`;
}

function generateAppToolInstructions(
  app: { id: string; name: string; slug: string },
  isSelected: boolean,
): string {
  const appDef = getBuiltinApp(app.slug);
  if (!appDef?.tools || appDef.tools.length === 0) return "";

  const toolPrefix = `app_${app.slug.replace(/-/g, "_")}`;
  const toolNames = appDef.tools.map((t) => `${toolPrefix}_${t.name}`);
  const toolDescriptions = appDef.tools
    .map((t) => `${t.name}: ${t.description}`)
    .join("; ");

  const priority = isSelected ? " [SELECTED - USE THIS FIRST]" : "";
  return `- ${app.name}${priority}: Tools: ${toolNames.join(", ")} (${toolDescriptions})`;
}

function formatConnectedApps(
  connectedApps: Array<{ id: string; name: string; slug: string }>,
  selectedAppIds: string[],
): string {
  if (connectedApps.length === 0) return "";

  const selectedApps = connectedApps.filter((app) =>
    selectedAppIds.includes(app.id),
  );
  const otherApps = connectedApps.filter(
    (app) => !selectedAppIds.includes(app.id),
  );

  const appLines = connectedApps.map((app) => {
    const isSelected = selectedAppIds.includes(app.id);
    const status = isSelected ? "selected" : "available";
    return `  <app name="${app.name}" status="${status}" />`;
  });

  const selectedInstructions = selectedApps
    .map((app) => generateAppToolInstructions(app, true))
    .filter(Boolean);

  const otherInstructions = otherApps
    .map((app) => generateAppToolInstructions(app, false))
    .filter(Boolean);

  const allInstructions = [...selectedInstructions, ...otherInstructions].join(
    "\n",
  );

  const priorityNote =
    selectedApps.length > 0
      ? `\n<priority>The user has explicitly selected ${selectedApps.map((a) => a.name).join(", ")}. You MUST use tools from selected apps when the request is relevant. Do not ignore selected apps.</priority>`
      : "";

  return `<connected_apps>
<purpose>The user has connected external applications. You have tools to interact with these apps.</purpose>
<apps>
${appLines.join("\n")}
</apps>${priorityNote}
<available_tools>
${allInstructions}
</available_tools>
<instruction>When the user's request relates to any connected app's functionality, use the appropriate app tools. Tool names follow the pattern: app_[app_slug]_[tool_name]</instruction>
</connected_apps>`;
}

export function buildSystemPrompt(
  context: UserContext,
  mcpToolInfos?: MCPToolInfo[],
  selectedAppIds?: string[],
): string {
  const parts: string[] = [];

  const cotMode = context.capabilities.prompting.chainOfThought;
  if (cotMode === "auto") {
    parts.push(AUTO_COT_INSTRUCTIONS);
  } else if (cotMode === "always") {
    parts.push(ALWAYS_COT_INSTRUCTIONS);
  }

  if (context.projectContext?.instructions) {
    parts.push(
      `<project_instructions>\n${context.projectContext.instructions}\n</project_instructions>`,
    );
  }

  if (context.capabilities.memory.personalization) {
    parts.push(SAVE_MEMORY_INSTRUCTIONS);
  }

  if (context.capabilities.tools.artifacts) {
    parts.push(ARTIFACT_INSTRUCTIONS);
  }

  if (mcpToolInfos && mcpToolInfos.length > 0) {
    parts.push(formatMCPTools(mcpToolInfos));
  }

  if (context.connectedApps && context.connectedApps.length > 0) {
    const appsText = formatConnectedApps(
      context.connectedApps,
      selectedAppIds ?? [],
    );
    if (appsText) {
      parts.push(appsText);
    }
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
      `<knowledge_base>\n${context.projectContext.documents.join("\n\n")}\n</knowledge_base>`,
    );
  }

  return parts.join("\n\n");
}
