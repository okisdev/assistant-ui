import type { UserContext } from "./context";

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
- Data visualizations or charts
- Simple games (tic-tac-toe, memory, etc.)
- Form layouts or UI components
- Countdown timers, clocks, or productivity tools
</when_to_use>

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

export const ZERO_SHOT_COT_INSTRUCTIONS = `<chain_of_thought>
<purpose>
Step-by-step reasoning improves accuracy for complex problems by making your thought process explicit, catching errors early, and ensuring thorough analysis before conclusions.
</purpose>

<instruction>
When answering complex questions, solving problems, or making decisions:

1. Begin with "Let me think through this step by step:" or similar phrasing
2. Break down the problem into clear, numbered steps
3. Show your work for each step, explaining your reasoning
4. Consider edge cases or potential issues
5. State your conclusion clearly, summarizing how you arrived at it

Apply this approach to: math problems, logic puzzles, code debugging, decision analysis, and any multi-step reasoning tasks.
</instruction>

<format>
Structure your response with visible reasoning:
- Use numbered steps (1, 2, 3...) for sequential reasoning
- Explicitly state assumptions and constraints
- Show intermediate results before final answers
- End with a clear "Conclusion:" or "Answer:" section
</format>
</chain_of_thought>`;

export const FEW_SHOT_COT_INSTRUCTIONS = `<chain_of_thought>
<purpose>
Step-by-step reasoning improves accuracy for complex problems by making your thought process explicit. The examples below demonstrate the expected reasoning pattern.
</purpose>

<examples>
<example type="math">
<question>What is 15% of 80?</question>
<reasoning>
Let me think through this step by step:
1. Convert percentage to decimal: 15% = 15/100 = 0.15
2. Multiply by the base value: 0.15 × 80
3. Calculate: 0.15 × 80 = 12
</reasoning>
<answer>The answer is 12.</answer>
</example>

<example type="logic">
<question>If all roses are flowers and some flowers fade quickly, can we conclude that some roses fade quickly?</question>
<reasoning>
Let me analyze this step by step:
1. Premise 1: All roses are flowers (roses ⊆ flowers)
2. Premise 2: Some flowers fade quickly (∃ flowers that fade quickly)
3. The flowers that fade quickly could be any flowers - daisies, tulips, etc.
4. Nothing guarantees roses are among the flowers that fade quickly
5. This is a logical fallacy called "undistributed middle"
</reasoning>
<answer>No, we cannot conclude that some roses fade quickly. The premises don't establish any connection between roses specifically and the property of fading quickly.</answer>
</example>

<example type="decision">
<question>Should I use a database index for a column that is rarely queried?</question>
<reasoning>
Let me consider the trade-offs step by step:
1. Benefits of indexing:
   - Faster SELECT queries on the indexed column
   - O(log n) lookup instead of O(n) table scan
2. Costs of indexing:
   - Additional storage space for the index structure
   - Slower INSERT operations (must update index)
   - Slower UPDATE operations on indexed column
   - Slower DELETE operations (must update index)
3. Analysis: If queries are rare, benefits are minimal. But write penalties apply to ALL write operations.
4. The cost-benefit ratio is unfavorable when read frequency is low.
</reasoning>
<answer>No, adding an index for a rarely queried column is generally not recommended. The constant write overhead outweighs the occasional read benefit.</answer>
</example>
</examples>

<instruction>
Apply this step-by-step reasoning pattern to all complex problems:
1. Start with "Let me think through this step by step:" or similar
2. Use numbered steps showing your reasoning process
3. State your conclusion clearly after the reasoning
</instruction>
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

export function buildSystemPrompt(context: UserContext): string {
  const parts: string[] = [];

  // Chain of Thought instructions (added first for prominence)
  const cotMode = context.capabilities.prompting.chainOfThought;
  if (cotMode === "zero-shot") {
    parts.push(ZERO_SHOT_COT_INSTRUCTIONS);
  } else if (cotMode === "few-shot") {
    parts.push(FEW_SHOT_COT_INSTRUCTIONS);
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
