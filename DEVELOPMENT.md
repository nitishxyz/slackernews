# Local Development Guide

This guide covers the prerequisites and steps to set up SlackerNews locally.

## 1. Prerequisites

Before you begin, ensure you have the following tools installed:

### Runtime & Package Manager
*   **[Bun](https://bun.sh)** (v1.0 or later): We use Bun for all package management and scripting.
    ```bash
    curl -fsSL https://bun.sh/install | bash
    ```

### Infrastructure Tools
*   **[AWS CLI](https://aws.amazon.com/cli/)**: SST deploys your personal development stage to your AWS account.
    *   Install and configure with `aws configure`.
    *   *Note: You need an active AWS account.*

### Optional but Recommended
*   **[Docker](https://www.docker.com/)**: If you plan to run local database containers or other services in the future.

## 2. Initial Setup

1.  **Clone the repository**:
    ```bash
    git clone <repo-url>
    cd slackernews
    ```

2.  **Install dependencies**:
    ```bash
    bun install
    ```

3.  **Configure AWS Credentials**:
    Ensure your terminal session has access to AWS. SST uses these to deploy your personal ephemeral stack.
    ```bash
    aws configure
    # Follow the prompts to enter your Access Key ID and Secret Access Key
    ```

## 3. Starting the Environment

We use **SST** to manage the full-stack environment.

1.  **Start the Dev Server**:
    ```bash
    sst dev
    ```
    *   This will deploy your personal stage (e.g., `dev-username-slackernews`) to AWS.
    *   It boots up the Frontend (TanStack Start) locally.
    *   It sets up the link to your Postgres database.
    *   **Note**: If prompted, enter your `sudo` password. This allows SST to create a network tunnel to your VPC so you can access the private database locally.

2.  **Access the App**:
    *   Frontend: `http://localhost:3000`
    *   SST Console: Printed in the terminal (allows you to manage resources).

## 4. Database Management

We use **Drizzle ORM** with PostgreSQL.

### Running Migrations
After changing schema files in `packages/core/db/schema`:

1.  **Generate SQL**:
    ```bash
    bun --filter @slackernews/core generate
    ```
2.  **Apply to DB**:
    ```bash
    bun --filter @slackernews/core migrate
    ```

### Drizzle Studio
SST automatically starts Drizzle Studio when you run `sst dev`. Check your terminal output for the Studio URL (usually `https://local.drizzle.studio...`) to view and edit database content visually.

## 5. Troubleshooting

*   **"Script not found 'dev'"**: Run `sst dev` from the root, not `bun dev`.
*   **AWS Permissions Errors**: Ensure your IAM user has sufficient permissions (AdministratorAccess is recommended for personal dev accounts) and that `aws s3 ls` works in your terminal.
