# AGENTS.md

## Project Overview

This is the official demo application for [assistant-ui](https://www.assistant-ui.com), an open-source React toolkit for building AI chat experiences. The demo showcases authentication, session management, and a clean, modern UI design.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Authentication**: better-auth with Drizzle adapter
- **Database**: PostgreSQL with Drizzle ORM
- **API**: tRPC for type-safe API routes
- **UI**: Tailwind CSS, Radix UI primitives, shadcn/ui components
- **State**: TanStack Query (React Query)
- **Forms**: react-hook-form with Zod validation

## Dev Commands

```bash
# Install dependencies (from monorepo root)
pnpm install

# Start development server (from monorepo root)
pnpm dev --filter @assistant-ui/demo

# Or start all apps
pnpm dev

# Database migrations
pnpm drizzle-kit push

# Type check
pnpm tsc --noEmit

# Lint
pnpm biome check .

# Lint with auto-fix
pnpm biome check --write .
```

Required environment variables:
- `AUTH_SECRET` - Secret for better-auth
- `DATABASE_URL` - PostgreSQL connection string
- `APPLICATION_GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `APPLICATION_GITHUB_CLIENT_SECRET` - GitHub OAuth client secret

## Dev Environment Tips

- This is a monorepo using pnpm workspaces and Turborepo
- The demo app is at `apps/demo/`
- Use `--filter @assistant-ui/demo` to target this specific package
- Check `package.json` for the exact package name before running filtered commands
- Shared UI components are in `components/ui/` (shadcn/ui style)
- Feature components are organized by domain: `components/dashboard/`, `components/auth/`, etc.

## Project Structure

```
apps/demo/
├── app/                    # Next.js App Router pages
│   ├── (app)/             # Main app routes (chat, share)
│   ├── (auth)/            # Auth routes (login, forgot-password)
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes (auth, tRPC)
├── components/
│   ├── ui/                # Base UI components (shadcn/ui)
│   ├── home/              # Home page components
│   ├── dashboard/         # Dashboard feature components
│   ├── auth/              # Auth-related components
│   ├── shared/            # Shared layout components
│   └── assistant-ui/      # Chat UI components
├── lib/                   # Utilities and configurations
├── server/                # tRPC routers and context
└── hooks/                 # Custom React hooks
```

## Code Style Guidelines

### TypeScript
- **NO `any` types** - Always use proper types; search for library types before defining custom ones
- **NO barrel files** (`index.ts`) unless necessary
- Use strict TypeScript mode

### Components
- Keep related code together - don't over-split into too many files
- Use `"use client"` only when needed (hooks, event handlers)
- Prefer server components when possible

### Imports
- Use path aliases (`@/`) for imports
- Group imports: external packages → internal modules → relative imports

### Naming
- Components: PascalCase (`SessionList.tsx`)
- Utilities/hooks: camelCase (`useSession.ts`)
- Types: PascalCase (`type Session = ...`)

## Design Principles

### UI Philosophy
- **Minimal and clean** - No unnecessary visual clutter
- **No cards for simple layouts** - Use spacing instead
- **No border lines** - Avoid `border`, `border-r`, `border-b` for separators; use spacing and backgrounds
- **Content centered** - Keep main content centered in the viewport (`max-w-2xl` or `max-w-3xl`)
- **Consistent with home page design** - Reference `components/home/pages/authenticated.tsx` for patterns

### Visual Separation (NO borders)
Instead of borders, use these patterns:
- **Header separation**: `bg-background/80 backdrop-blur-sm` (transparent with blur)
- **List items**: `bg-muted/30` with `hover:bg-muted` for hover state
- **Info boxes**: `bg-muted/50` with `rounded-lg` (no border)
- **Icon containers**: `bg-muted/50` with `rounded-full`
- **Inactive elements**: `bg-muted/20` for subtle distinction
- **Interactive elements**: Use `hover:bg-muted` or `hover:bg-accent` for clear hover feedback

### Status Indication
Use colors to indicate status, not borders:
- **Active/Success**: Green tint (`bg-emerald-500/10`, `text-emerald-500`)
- **Inactive/Default**: Muted (`bg-muted`, `text-muted-foreground`)
- **Destructive**: Red tint (`bg-destructive/10`, `text-destructive`)

### Component Choices
- **Popover** for quick actions (share link, quick settings)
- **Dialog** for complex multi-step flows or forms
- **AlertDialog** for destructive action confirmations
- **DropdownMenu** for contextual actions on items

### Layout Patterns
- Use `AppLayout` wrapper for authenticated pages with sidebar
- Maximum content width: `max-w-2xl` for readability, `max-w-3xl` for wider content
- Subtle backgrounds: `bg-muted/50` with `rounded-full` for icons
- Brand consistency: Use `MessagesSquare` icon in standalone page headers

### Link & Button Patterns
- **Text links**: `text-muted-foreground hover:text-foreground` with subtle arrow animation
- **CTA links**: Include arrow icon with `group-hover:translate-x-0.5` animation
- **Ghost buttons**: For secondary actions in headers

### Loading States
- Use inline skeleton patterns, not full-page loaders
- Keep skeletons simple (animated divs with `bg-muted`)

### User Feedback
- Use `sonner` toast for success/error messages (keep messages short: "Copied", "Link created")
- Use `AlertDialog` for destructive action confirmations

## Key Patterns

### Authentication
```typescript
// Server-side session check
const session = await auth.api.getSession({
  headers: await headers(),
});

// Client-side session hook
const { data: session } = authClient.useSession();
```

### tRPC Usage
```typescript
// Define router in server/routers/
export const exampleRouter = createTRPCRouter({
  getData: publicProcedure.query(async ({ ctx }) => {
    // ...
  }),
});

// Use in components
const { data } = api.example.getData.useQuery();
```

### Component Organization
Keep feature-related code in a single file unless it grows too large:
```typescript
// components/dashboard/account/session-list.tsx
// Contains: types, helpers, sub-components, main export
```

## assistant-ui Limitations

When implementing features blocked by `assistant-ui` package limitations, document them in `enhancements.md` with:
- Problem description
- Current workaround
- Proposed upstream solution

## Do NOT

- Create documentation files (README, .md) unless explicitly asked
- Run build commands after changes
- Use `any` type when proper types exist
- Create unnecessary barrel/index files
- Over-engineer with excessive abstractions
- Add Card components for simple list layouts
- Use border lines (`border-r`, `border-b`) for visual separation
- Use heavy Dialog for simple quick actions (use Popover instead)
