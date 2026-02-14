# MCP Example

This example demonstrates how to use `@assistant-ui/react` with [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) tools via `@ai-sdk/mcp`.

## Quick Start

### Using CLI (Recommended)

```bash
npx assistant-ui@latest create my-app --example with-mcp
cd my-app
```

### Environment Variables

Create `.env.local`:

```
OPENAI_API_KEY=your-api-key-here
MCP_SERVER_URL=http://localhost:8080/mcp
```

### Run the MCP Server

This example includes a mock MCP server that provides a `get_weather` tool:

```bash
npm run mcp-server
```

### Run the App

In a separate terminal:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and try asking about the weather.

## How It Works

1. **MCP Server** (`mcp-server.ts`): A Streamable HTTP MCP server built with `@modelcontextprotocol/sdk` that exposes a `get_weather` tool.
2. **API Route** (`app/api/chat/route.ts`): Connects to the MCP server using `@ai-sdk/mcp`, retrieves available tools, and passes them to `streamText`.
3. **Frontend** (`app/page.tsx`): Uses `useChatRuntime` with `sendAutomaticallyWhen` to automatically loop when MCP tools are called. Includes render-only tool UI definitions via the `Tools()` API.

## Key Concepts

- **Backend-only tools**: MCP tools execute on the server side. The frontend uses `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls` to automatically send follow-up messages after tool execution.
- **Custom Tool UI**: The `Tools()` API with render-only definitions (no `execute`) lets you add custom UI for MCP tools.
- **Multiple servers**: You can connect to multiple MCP servers by creating multiple clients and merging their tools.

## Related Documentation

- [assistant-ui MCP Guide](https://www.assistant-ui.com/docs/guides/mcp)
- [AI SDK MCP Documentation](https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools)
- [MCP Specification](https://modelcontextprotocol.io/)
