# assistant-ui demo agents guide

## Project Overview

Official demo app for [assistant-ui](https://www.assistant-ui.com) - React toolkit for AI chat experiences.

**Tech**: Next.js 16, better-auth, PostgreSQL, Drizzle ORM, tRPC, Tailwind CSS, Radix UI

## Setup Commands

```bash
# Install dependencies
pnpm install

# Start dev server (from monorepo root)
pnpm demo:dev

# Database migrations
pnpm drizzle-kit push
```

## Dev Environment Tips

- Monorepo using pnpm workspaces + Turborepo
- Use `--filter @assistant-ui/demo` to target this package
- Check `package.json` for exact package name before filtered commands
- App structure: `app/` (routes), `components/` (UI), `lib/` (utils), `server/` (tRPC)

## Code Style

### TypeScript
- **NO `any` types** - Search for library types first
- **NO barrel files** (`index.ts`) unless necessary
- **NO unnecessary comments** - Code should be self-documenting, avoid JSDoc unless for public APIs
- Strict mode enabled

### Components
- **Keep related code together** - 300-500 lines in one file > 5 small files with cross-dependencies
- Don't split unless: reused elsewhere OR > 500 lines
- Use `"use client"` only when needed (hooks, event handlers)

**Bad**:
```typescript
// footer.tsx
export const ActionButton = () => { }
// input.tsx
import { ActionButton } from "./footer"  // Wrong place!
```

**Good**:
```typescript
// input.tsx (~400 lines)
const ActionButton = () => { }
export const Input = () => { }
```

### File Structure
```typescript
// Imports
// Constants & types (local only)
// Helpers (local only)
// Sub-components (local only)
// Main export
```

### Naming
- Components: `PascalCase` (`SessionList.tsx`)
- Hooks/utils: `camelCase` (`useSession.ts`)
- Types: `PascalCase` (`type Session = ...`)

### Imports
- Use `@/` path aliases
- Group: external packages → internal modules → relative imports

## UI Guidelines

### Core Principles
- Minimal, clean design
- **NO borders** - Use `bg-muted/50`, spacing, and subtle backgrounds instead
- **NO Card components** for simple layouts - Use spacing
- Center content: `max-w-2xl` (readable) or `max-w-3xl` (wider)

### Visual Patterns
- Headers: `bg-background/80 backdrop-blur-sm`
- List items: `bg-muted/50` + `hover:bg-muted`
- Icons: `bg-muted/50` + `rounded-full`

### Colors (Semantic)
- Active/Success: `bg-emerald-500/10 text-emerald-500`
- Destructive: `bg-destructive/10 text-destructive`
- Reasoning/Thinking: `bg-amber-500/5 text-amber-600`
- Default: `bg-muted text-muted-foreground`

### Components
- **Popover**: Quick actions
- **Dialog**: Complex flows/forms
- **AlertDialog**: Destructive confirmations
- **DropdownMenu**: Contextual actions

## Key Patterns

### Authentication
```typescript
// Server
const session = await auth.api.getSession({ headers: await headers() });

// Client
const { data: session } = authClient.useSession();
```

### tRPC
```typescript
// Define in server/routers/
export const router = createTRPCRouter({
  getData: publicProcedure.query(async ({ ctx }) => { }),
});

// Client
const { data } = api.example.getData.useQuery();

// Server (API/lib)
import { api } from "@/utils/trpc/server";
const data = await api.example.getData();
```

## Do

- Use tRPC for all database operations
- Keep related code together in one file
- Search for library types before defining custom ones
- Handle multi-state buttons with single component (order conditions by priority)
- Use `Button` with `size="icon"` and `rounded-full` for primary actions
- Check `apps/registry/components/` for reusable assistant-ui components before building custom ones

## Do NOT

- Create docs/README files unless explicitly asked
- Run build commands after changes
- Use `any` type
- Create barrel files unless necessary
- Export internal components from wrong modules
- Use borders (`border-r`, `border-b`) for separation
- Use Card components for simple lists
- Use Dialog for simple quick actions (use Popover)
- Send system prompts or tool schemas from frontend to backend

## Documentation Files

| File | Purpose |
|------|---------|
| `roadmap.md` | Feature checklist - what's implemented vs planned |
| `enhancements.md` | Proposals for features to upstream to assistant-ui |
| `refactoring.md` | Demo code that could use existing assistant-ui features |

## assistant-ui Limitations

Document blocked features in `enhancements.md` with:
- Problem description
- Current workaround
- Proposed upstream solution
