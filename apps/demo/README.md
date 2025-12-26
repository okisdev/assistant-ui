# Assistant UI Demo

Official demo application showcasing [assistant-ui](https://www.assistant-ui.com) capabilities.

## Tech Stack

- **Framework**: Next.js 16, React 19
- **Auth**: better-auth (Email/Password, GitHub, Google OAuth)
- **Database**: PostgreSQL + Drizzle ORM
- **API**: tRPC
- **AI**: AI SDK (OpenAI, xAI providers)
- **Styling**: Tailwind CSS, Radix UI

## Getting Started

```bash
# Install dependencies (from monorepo root)
pnpm install

# Start dev server
pnpm demo:dev

# Database setup
pnpm drizzle-kit push
```

## Documentation Files

| File | Purpose |
|------|---------|
| [`AGENTS.md`](./AGENTS.md) | AI coding assistant guidelines and project conventions |
| [`roadmap.md`](./roadmap.md) | Feature implementation status and planning |
| [`enhancements.md`](./enhancements.md) | Proposals for upstream assistant-ui improvements |
| [`refactoring.md`](./refactoring.md) | Code cleanup opportunities using existing features |

### AGENTS.md
Guidelines for AI coding assistants (Cursor, Copilot, etc.) working on this codebase. Includes code style, component patterns, and UI guidelines.

### roadmap.md
Comprehensive feature checklist tracking:
- ✅ What's implemented in the demo
- ⬜ What's planned but not yet built
- 🔗 Mapping to assistant-ui package features

### enhancements.md
Proposals for `@assistant-ui/react` improvements discovered through demo development:
- Bug reports and limitations
- Feature proposals with API designs
- Priority ranking for contributions

### refactoring.md
Opportunities to simplify demo code by using existing assistant-ui features:
- Custom implementations that could use package primitives
- Underutilized features in assistant-ui
- Step-by-step refactoring guide

## Project Structure

```
apps/demo/
├── app/                    # Next.js App Router pages
│   ├── (app)/             # Authenticated app routes
│   │   ├── (chat)/        # Chat interface
│   │   └── (dashboard)/   # Settings & management
│   ├── (auth)/            # Authentication pages
│   └── api/               # API routes
├── components/
│   ├── assistant-ui/      # Chat UI components
│   ├── dashboard/         # Dashboard components
│   ├── shared/            # Shared layout components
│   └── ui/                # shadcn/ui components
├── contexts/              # React context providers
├── hooks/                 # Custom React hooks
├── lib/
│   ├── adapters/          # assistant-ui adapters
│   ├── ai/                # AI configuration & tools
│   └── database/          # Drizzle schema & utils
├── server/                # tRPC routers
└── utils/                 # Utility functions
```

## Key Features

- **Multi-model chat** with OpenAI and xAI providers
- **Message persistence** with branching support
- **Memory system** for personalization
- **Artifacts** with sandboxed preview
- **Web search** integration
- **Image generation** with DALL-E and Grok
- **Voice input/output** via Web Speech API
- **MCP server** integration with OAuth
- **Usage tracking** with analytics dashboard
- **Project management** with document uploads

## Related Links

- [assistant-ui Documentation](https://www.assistant-ui.com/docs)
- [assistant-ui GitHub](https://github.com/assistant-ui/assistant-ui)
