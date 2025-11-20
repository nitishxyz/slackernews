# SlackerNews

A high-signal, low-noise content aggregation and discussion platform for the Solana ecosystem. Inspired by Hacker News, but built with "Skin in the Game" economics.

## The Core Concept

**"Talk is cheap. Quality signal is not."**

Traditional social platforms are plagued by spam, bots, and low-effort fluff because interaction is free. SlackerNews solves this by introducing micro-costs for interactions, leveraging the speed and low fees of Solana.

### Economic Model (Draft)

*   **Submissions**: Cost **$0.20 USDC**. This creates a barrier to entry that discourages spam and low-effort links.
*   **Comments**: Cost **$0.05 USDC**. Encourages thoughtful discussion over "first!", "lol", or flame wars.
*   **Upvotes**: Cost **$0.01 USDC**. Curation is not free; putting a price on upvotes ensures that users only promote content they genuinely value.

#### Revenue Sharing
 *   **80%** of the USDC generated from comments and upvotes is sent directly to the Original Poster's (OP) wallet.
 *   **20%** is retained as a platform fee to sustain operations and development.

### Tech Stack

*   **Frontend**: [TanStack Start](https://tanstack.com/start) (React, SSR, Streaming).
*   **Database**: PostgreSQL (via [Neon](https://neon.tech) or AWS RDS), managed by [Drizzle ORM](https://orm.drizzle.team).
*   **Infrastructure**: [SST](https://sst.dev) (Serverless, AWS).
*   **Auth & Wallets**: [Privy](https://privy.io) (Embedded Wallets). Users sign in via Privy and use the embedded wallet for interactions.
*   **Payments**: Solana (USDC). Users load their Privy wallets with USDC. Transaction fees (gas) are sponsored by the platform.
*   **Monorepo**: Bun workspaces.

## Project Structure

*   `apps/frontend`: The main web application (SSR).
*   `packages/core`: Shared business logic and database schema (Drizzle).
*   `infra`: SST infrastructure definitions.

## Getting Started

1.  **Install Dependencies**:
    ```bash
    bun install
    ```

2.  **Start Development Environment**:
    ```bash
    sst dev
    ```
    This starts the full stack:
    *   Frontend at `http://localhost:3000`
    *   Infrastructure (if not deployed, it will prompt to deploy)
    *   Drizzle Studio (for DB management)

3.  **Database Migrations**:
    *   Generate migrations: `bun --filter @slackernews/core generate`
    *   Apply migrations: `bun --filter @slackernews/core migrate`
