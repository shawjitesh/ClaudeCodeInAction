# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style

Use comments sparingly. Only comment complex code.

## Commands

```bash
npm run setup       # First-time setup: install deps, generate Prisma client, migrate DB
npm run dev         # Start dev server with Turbopack hot reload
npm run build       # Production build
npm run lint        # Run ESLint
npm run test        # Run all Vitest tests
npm run db:reset    # Reset the SQLite database (destructive)
```

All dev/build/start scripts prepend `NODE_OPTIONS='--require ./node-compat.cjs'` — this shim removes `globalThis.localStorage`/`sessionStorage` for Node.js 25+ SSR compatibility.

Running a single test file: `npx vitest run <path-to-test-file>`

## Architecture

UIGen is a Next.js 15 app that lets users describe React components in natural language and get live previews. Claude generates code by calling tools that manipulate a **virtual (in-memory) file system**.

### Core Data Flow

1. User sends a message → `POST /api/chat`
2. Server streams `streamText()` response with two tools: `str_replace_editor` (create/view/edit files) and `file_manager` (rename/delete)
3. Tool calls are executed **client-side** in `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`)
4. After each tool call, the virtual FS updates and the preview re-renders
5. On stream completion, project is saved to DB (if authenticated)

### Virtual File System

`VirtualFileSystem` (`src/lib/file-system.ts`) is a pure in-memory tree with no disk I/O. It serializes to/from JSON for DB persistence. All file operations (create, read, update, delete, rename, str-replace, insert) happen here.

### Live Preview

`src/lib/transform/jsx-transformer.ts` compiles the virtual FS into an iframe:

- Builds blob URL import map from all `.tsx`/`.ts` files
- Generates an `srcdoc` string that loads Babel standalone + the import map
- `@/` path aliases are resolved to blob URLs at runtime

### State Management

Two React contexts wrap the entire app:
- **`ChatContext`** (`src/lib/contexts/chat-context.tsx`): owns chat messages and the `useChat` hook (Vercel AI SDK)
- **`FileSystemContext`** (`src/lib/contexts/file-system-context.tsx`): owns the `VirtualFileSystem` instance and `handleToolCall` — the bridge between AI tool calls and the FS

### Authentication

Stateless JWT (via `jose`) stored in HTTP-only cookies. `src/lib/auth.ts` handles session creation/verification. Server actions in `src/actions/` handle sign-up/sign-in/sign-out. Middleware (`src/middleware.ts`) protects API routes.

Anonymous users: work is tracked in sessionStorage (`src/lib/anon-work-tracker.ts`) and can be resumed after sign-in.

### Database

The full schema is in `prisma/schema.prisma` — refer to it whenever you need to understand the structure of data stored in the database. Prisma + SQLite (`prisma/dev.db`). Two models:

- `User`: email + bcrypt-hashed password
- `Project`: stores `messages` (JSON array) and `data` (serialized VirtualFileSystem) as strings. `userId` is nullable to support anonymous projects.

### Mock Mode

When `ANTHROPIC_API_KEY` is absent, `src/lib/provider.ts` falls back to `MockLanguageModel`, which simulates multi-step tool calls and returns static React components. The app is fully functional without a real API key.

### Layout

`src/app/main-content.tsx` is the top-level UI shell:
- Left 35%: `ChatInterface`
- Right 65%: toggleable between `PreviewFrame` (iframe) and a split `FileTree` (30%) + `CodeEditor` (70%)

Panels are draggable via `react-resizable-panels`.
