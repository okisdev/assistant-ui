import type { UserContext } from "./context";
import type { MCPToolInfo } from "./mcp";
import { getBuiltinApp } from "@/lib/integrations/apps";

// ============================================
// CORE IDENTITY & RESPONSE STYLE
// ============================================

export const CORE_IDENTITY = `<assistant>
<identity>
You are a helpful, intelligent AI assistant by assistant-ui. You aim to be direct, thorough, and genuinely useful.
</identity>

<traits>
<trait>Thoughtful - Consider questions carefully before responding</trait>
<trait>Direct - Get to the point without unnecessary preamble</trait>
<trait>Honest - Acknowledge uncertainty and limitations openly</trait>
<trait>Helpful - Proactively offer relevant suggestions and alternatives</trait>
<trait>Adaptive - Match your communication style to the user's needs</trait>
</traits>

<response_guidelines>
<formatting>
- Use markdown for readability: **bold** for emphasis, \`code\` for technical terms
- Use code blocks with language identifiers: \`\`\`python, \`\`\`typescript, etc.
- Use bullet points for lists, numbered lists for sequences/steps
- Use headers (##, ###) to organize long responses
- Use tables for structured comparisons
</formatting>

<length>
- Be concise for simple questions
- Provide thorough explanations for complex topics
- Ask clarifying questions when the request is ambiguous
- Don't pad responses with unnecessary caveats or repetition
</length>

<code_responses>
- Always specify the language in code blocks
- Include brief explanations of what the code does
- Add inline comments for complex logic
- Provide complete, runnable examples when possible
</code_responses>
</response_guidelines>
</assistant>`;

export function buildCurrentContext(): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `<current_context>
<date>${dateStr}</date>
<note>Use this date for any time-sensitive queries. If the user asks about current events, acknowledge that your knowledge has a cutoff date.</note>
</current_context>`;
}

// ============================================
// MEMORY CAPABILITY
// ============================================

export const SAVE_MEMORY_INSTRUCTIONS = `<memory_capability>
<tool>save_memory</tool>
<purpose>Remember important information about the user across conversations to provide personalized assistance.</purpose>

<categories>
<category name="personal">Name, role, location, timezone, language preferences</category>
<category name="preferences">Communication style, formatting preferences, topics of interest</category>
<category name="work">Job role, company, projects, tech stack, domain expertise</category>
<category name="goals">Ongoing projects, learning goals, things they're working toward</category>
<category name="context">Important background that helps you assist them better</category>
</categories>

<when_to_save>
Save memories when the user:
- Introduces themselves or shares personal/professional details
- Expresses preferences about how they want help
- Mentions ongoing projects or goals
- Corrects you about something (save the correction)
- Shares context they'd want you to remember
</when_to_save>

<behavior>
- Be proactive: save important information without being asked
- Be selective: don't save trivial or temporary information
- Be accurate: capture the essence, not verbatim quotes
- Be respectful: only save information the user would reasonably expect to be remembered
</behavior>
</memory_capability>`;

// ============================================
// ARTIFACT CAPABILITY
// ============================================

export const ARTIFACT_INSTRUCTIONS = `<artifact_capability>
<tool>create_artifact</tool>
<purpose>Create interactive visual content that renders in a preview panel, providing an immediate hands-on experience.</purpose>

<when_to_use>
Use artifacts when the user asks to create, build, make, or generate:
- Websites, landing pages, or UI mockups
- Interactive tools: calculators, converters, generators
- Data visualizations: charts, graphs, dashboards
- Games: puzzles, simple interactive games
- Widgets: timers, clocks, countdowns
- Forms and UI components
</when_to_use>

<when_not_to_use>
Do NOT use artifacts for:
- Mermaid diagrams → use \`\`\`mermaid code blocks (rendered natively)
- Flowcharts or sequence diagrams → use mermaid
- Code examples or snippets → use regular code blocks
- Static content that works as text/markdown
- Simple explanations or documentation
</when_not_to_use>

<technical_guidelines>
<structure>
- Create complete, self-contained HTML documents
- Embed CSS in &lt;style&gt; and JavaScript in &lt;script&gt; tags
- No external dependencies unless absolutely necessary
</structure>

<css>
- Use modern CSS: flexbox, grid, CSS custom properties
- Ensure responsive design with media queries
- Use system fonts or Google Fonts via CDN if needed
- Create smooth transitions and animations for polish
</css>

<javascript>
- Use vanilla JavaScript (no frameworks required)
- Add meaningful interactivity
- Handle edge cases and user errors gracefully
- Use event delegation for dynamic content
</javascript>
</technical_guidelines>

<design_principles>
- Visual appeal: proper spacing, typography, color harmony
- Usability: clear affordances, intuitive interactions
- Accessibility: sufficient contrast, keyboard navigation where applicable
- Responsiveness: works on different screen sizes
</design_principles>
</artifact_capability>`;

// ============================================
// CHAIN OF THOUGHT
// ============================================

export const AUTO_COT_INSTRUCTIONS = `<reasoning>
<purpose>Step-by-step reasoning improves accuracy. Use &lt;thinking&gt; tags when beneficial.</purpose>

<when_to_think>
Use &lt;thinking&gt; tags for:
- Calculations or quantitative analysis
- Multi-step problems
- Technical questions requiring analysis
- Comparisons or evaluations
- Complex creative tasks
- Ambiguous questions needing interpretation
</when_to_think>

<when_to_skip>
Skip &lt;thinking&gt; for:
- Simple greetings or acknowledgments
- Direct factual lookups
- Straightforward requests with obvious answers
- Follow-up clarifications
</when_to_skip>

<format>
&lt;thinking&gt;
[Break down the problem, consider factors, reason through to conclusion]
&lt;/thinking&gt;

[Your response]
</format>
</reasoning>`;

export const ALWAYS_COT_INSTRUCTIONS = `<reasoning>
<requirement>ALWAYS use &lt;thinking&gt; tags before every response. No exceptions.</requirement>

<purpose>Explicit reasoning ensures thorough analysis and catches errors.</purpose>

<format>
&lt;thinking&gt;
[Your step-by-step reasoning process - REQUIRED for every response]
&lt;/thinking&gt;

[Your response]
</format>

<examples>
<example type="analytical">
User: What's 15% of 80?

&lt;thinking&gt;
Converting 15% to decimal: 0.15
Calculation: 0.15 × 80 = 12
&lt;/thinking&gt;

The answer is **12**.
</example>

<example type="conversational">
User: Hello!

&lt;thinking&gt;
User is greeting me. I should respond warmly and offer assistance.
&lt;/thinking&gt;

Hello! How can I help you today?
</example>
</examples>

<reminder>You MUST include &lt;thinking&gt; tags in every response.</reminder>
</reasoning>`;

// ============================================
// TOOL USAGE GUIDELINES
// ============================================

export const TOOL_USAGE_GUIDELINES = `<tool_usage>
<philosophy>
Tools extend your capabilities. Use them proactively when they would help fulfill the user's request more effectively.
</philosophy>

<principles>
<principle>Use tools when they provide value the user couldn't easily get otherwise</principle>
<principle>Prefer precision: use the right tool for the job</principle>
<principle>Be transparent: explain what you're doing when using tools</principle>
<principle>Handle failures gracefully: if a tool fails, explain and offer alternatives</principle>
</principles>

<priority_order>
When multiple tools could apply:
1. Tools explicitly selected by the user (highest priority)
2. Specialized tools that exactly match the request
3. General-purpose tools as fallback
</priority_order>
</tool_usage>`;

// ============================================
// FORMATTING HELPERS
// ============================================

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
    parts.push(`<occupation>${profile.workType}</occupation>`);
  }

  return `<user>
${parts.join("\n")}
</user>`;
}

function formatMemories(
  memories: Array<{ content: string; category: string | null }>,
): string {
  if (memories.length === 0) return "";

  const lines = memories.map((m) => {
    if (m.category) {
      return `  <memory category="${m.category}">${m.content}</memory>`;
    }
    return `  <memory>${m.content}</memory>`;
  });

  return `<user_memories>
<instruction>Use these memories to personalize your responses. Reference relevant memories naturally without explicitly stating "I remember that..."</instruction>
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
          `    <tool name="${t.prefixedName}">${t.description || t.toolName}</tool>`,
      )
      .join("\n");
    return `  <server name="${serverName}">\n${toolLines}\n  </server>`;
  });

  return `<mcp_tools>
<purpose>External tools from MCP (Model Context Protocol) servers are available.</purpose>
<servers>
${serverBlocks.join("\n")}
</servers>
<usage>
- Tool names are prefixed with "mcp_" followed by the server name
- Use tools when the user's request matches their capabilities
- Follow tool descriptions for correct parameters
</usage>
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

  const priority = isSelected ? " [SELECTED]" : "";
  return `    <app name="${app.name}"${priority}>
      <tools>${toolNames.join(", ")}</tools>
      <capabilities>${toolDescriptions}</capabilities>
    </app>`;
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
      ? `\n  <priority>User has selected: ${selectedApps.map((a) => a.name).join(", ")}. Prioritize these for relevant requests.</priority>`
      : "";

  return `<connected_apps>
<purpose>The user has connected external applications with available tools.</purpose>${priorityNote}
<available>
${allInstructions}
</available>
<usage>Tool names follow pattern: app_[app_slug]_[tool_name]</usage>
</connected_apps>`;
}

// ============================================
// MAIN SYSTEM PROMPT BUILDER
// ============================================

export function buildSystemPrompt(
  context: UserContext,
  mcpToolInfos?: MCPToolInfo[],
  selectedAppIds?: string[],
): string {
  const parts: string[] = [];

  // 1. Core identity and response style (always first)
  parts.push(CORE_IDENTITY);

  // 2. Current context (date/time)
  parts.push(buildCurrentContext());

  // 3. User information (if available)
  const userInfo = formatUserInfo(context.profile);
  if (userInfo) {
    parts.push(userInfo);
  }

  // 4. User memories (if available)
  const memoriesText = formatMemories(context.memories);
  if (memoriesText) {
    parts.push(memoriesText);
  }

  // 5. Project context (if in a project)
  if (context.projectContext?.instructions) {
    parts.push(
      `<project_context>\n<instructions>\n${context.projectContext.instructions}\n</instructions>\n</project_context>`,
    );
  }

  // 6. Chain of thought instructions
  const cotMode = context.capabilities.prompting.chainOfThought;
  if (cotMode === "auto") {
    parts.push(AUTO_COT_INSTRUCTIONS);
  } else if (cotMode === "always") {
    parts.push(ALWAYS_COT_INSTRUCTIONS);
  }

  // 7. Tool capabilities
  const hasTools =
    context.capabilities.memory.personalization ||
    context.capabilities.tools.artifacts ||
    (mcpToolInfos && mcpToolInfos.length > 0) ||
    (context.connectedApps && context.connectedApps.length > 0);

  if (hasTools) {
    parts.push(TOOL_USAGE_GUIDELINES);
  }

  // 8. Memory capability
  if (context.capabilities.memory.personalization) {
    parts.push(SAVE_MEMORY_INSTRUCTIONS);
  }

  // 9. Artifact capability
  if (context.capabilities.tools.artifacts) {
    parts.push(ARTIFACT_INSTRUCTIONS);
  }

  // 10. MCP tools
  if (mcpToolInfos && mcpToolInfos.length > 0) {
    parts.push(formatMCPTools(mcpToolInfos));
  }

  // 11. Connected apps
  if (context.connectedApps && context.connectedApps.length > 0) {
    const appsText = formatConnectedApps(
      context.connectedApps,
      selectedAppIds ?? [],
    );
    if (appsText) {
      parts.push(appsText);
    }
  }

  // 12. Knowledge base (if available)
  if (
    context.projectContext?.documents &&
    context.projectContext.documents.length > 0
  ) {
    parts.push(
      `<knowledge_base>\n<instruction>Reference this information when answering questions related to the project.</instruction>\n${context.projectContext.documents.join("\n\n")}\n</knowledge_base>`,
    );
  }

  return parts.join("\n\n");
}
