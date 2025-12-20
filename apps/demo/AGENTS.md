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

## Development Setup

```bash
# Install dependencies (from monorepo root)
pnpm install

# Start development server
pnpm dev

# Database migrations
pnpm drizzle-kit push
```

Required environment variables:
- `AUTH_SECRET` - Secret for better-auth
- `DATABASE_URL` - PostgreSQL connection string
- `APPLICATION_GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `APPLICATION_GITHUB_CLIENT_SECRET` - GitHub OAuth client secret

## Project Structure

```
apps/demo/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth routes (login, forgot-password)
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes (auth, tRPC)
├── components/
│   ├── ui/                # Base UI components (shadcn/ui)
│   ├── home/              # Home page components
│   ├── dashboard/         # Dashboard feature components
│   └── auth/              # Auth-related components
├── lib/                   # Utilities and configurations
├── server/                # tRPC routers and context
└── database/              # Drizzle schema and relations
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
- **Content centered** - Keep main content centered in the viewport
- **Consistent with home page design** - Reference `components/home/pages/authenticated.tsx` for patterns

### Layout Patterns
- Use `HomeLayout` wrapper for authenticated pages with sidebar
- Maximum content width: `max-w-2xl` for readability
- Use `divide-y` for list items instead of cards/tables
- Subtle backgrounds: `bg-muted/50` with `rounded-full` for icons

### Loading States
- Use inline skeleton patterns, not full-page loaders
- Keep skeletons simple (animated divs with `bg-muted`)

### User Feedback
- Use `sonner` toast for success/error messages
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

## Do NOT

- Create documentation files (README, .md) unless explicitly asked
- Run build commands after changes
- Use `any` type when proper types exist
- Create unnecessary barrel/index files
- Over-engineer with excessive abstractions
- Add Card components for simple list layouts
- Use border lines (`border-r`, `border-b`) for visual separation

