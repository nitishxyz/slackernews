# Agent Guide: SlackerNews

This document outlines the architectural decisions, project structure, and operational guidelines for AI agents working on this codebase. **Read this carefully before making changes.**

## 1. Architecture & Stack

We use a modern **Serverless Monorepo** architecture.

*   **Runtime**: [Bun](https://bun.sh) (for local dev and scripting).
*   **Framework**: [TanStack Start](https://tanstack.com/start) (React + SSR).
    *   *Why?* Best-in-class type safety, SSR for SEO, and "Server Functions" (`server$`) to eliminate the need for a separate API backend.
*   **Database**: PostgreSQL.
    *   *ORM*: [Drizzle ORM](https://orm.drizzle.team).
    *   *Location*: Schema and client are in `packages/core/db`.
*   **Infrastructure**: [SST](https://sst.dev) (ion).
    *   *Config*: `sst.config.ts` in root.
    *   *Resources*: Defined in `infra/`.
*   **Auth & Payments**:
    *   **Provider**: [Privy](https://privy.io).
    *   **Strategy**: Embedded wallets only. No external wallet connectors (Phantom/Solflare) for core interactions.
    *   **Currency**: USDC on Solana.
    *   **Gas**: Sponsored/Subsidized (User only needs USDC).

## 2. Project Structure

```
/
├── apps/
│   └── frontend/       # TanStack Start Application
│       ├── src/
│       │   ├── routes/ # File-based routing (TanStack Router)
│       │   ├── db/     # Frontend DB client (connects via SST link)
│       │   └── ...
│       └── package.json
├── packages/
│   └── core/           # Shared logic & Database Definition
│       ├── db/
│       │   ├── schema/ # Drizzle schema definitions
│       │   └── ...
│       ├── drizzle.config.ts
│       └── package.json
├── infra/              # SST Infrastructure definitions
├── sst.config.ts       # Main SST entry point
├── package.json        # Root package (workspace definitions)
└── ...
```

## 3. Development Workflow

*   **Start Command**: `sst dev`
    *   **DO NOT** run `bun dev` in `apps/frontend` directly unless you know what you are doing. `sst dev` sets up the environment variables and links resources.
*   **Database Changes**:
    1.  Modify schema in `packages/core/db/schema`.
    2.  Run `bun --filter @slackernews/core generate` to create migration files.
    3.  Run `bun --filter @slackernews/core migrate` to apply changes.

## 4. Guidelines for Agents

### File Operations
*   **Preferred Tool**: `apply_patch` for code edits. It is token-efficient and safer than full rewrites.
*   **Always Read First**: Never `apply_patch` without reading the file *in the current turn*. Files change.
*   **Pathing**: Use project-relative paths (e.g., `apps/frontend/src/routes/index.tsx`).

### Coding Conventions
*   **Server Functions**: Use `create_server_fn` or `server$` from TanStack Start for backend logic. Do not create separate API routes unless necessary for external webhooks.
*   **Type Safety**: Rely on Drizzle's inferred types and Zod for validation.
*   **Imports**:
    *   Import shared code from `@slackernews/core`.
    *   Example: `import { posts } from "@slackernews/core/db/schema";`

### Database
*   The `posts` table is already scaffolded in `packages/core`.
*   Use `db.select().from(posts)...` in your loaders.

### Task Execution
*   If a task involves multiple steps (e.g., "Add a comments feature"), break it down:
    1.  **Schema**: Update `packages/core/db/schema`.
    2.  **Migration**: Generate/Migrate.
    3.  **UI**: Create components in `apps/frontend`.
    4.  **Logic**: precise `server$` functions to handle the data.
