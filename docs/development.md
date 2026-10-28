# Development

## Local setup

Use Node.js 24 and pnpm 12.4.1 through Corepack. Install dependencies, create a private `.env` from the template, then start the service:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm db:generate
cp .env.example .env
pnpm start:dev
```

The service listens on port `3001` by default. Swagger UI is at `http://localhost:3001/docs`; OpenAPI JSON is at `http://localhost:3001/docs/openapi.json`. Generate Prisma Client after installing dependencies and whenever the Prisma schema changes.

## Environment variables

`.env.example` lists the configuration names. Keep `.env` private; `.env*` files are ignored except for the example template.

| Variable                   | Meaning                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `AUTH_DATABASE_URL`        | Required runtime connection for the AuthUser PostgreSQL schema. Use the runtime role limited to this schema. |
| `JWT_PRIVATE_KEY`          | Required PEM private key used to sign RS256 tokens. Literal `\n` escapes are converted to line breaks.       |
| `JWT_ISSUER`               | Required issuer claim for signed tokens.                                                                     |
| `JWT_AUDIENCE`             | Required audience claim for signed tokens.                                                                   |
| `CORS_ALLOWED_ORIGINS`     | Optional comma-separated list of exact browser origins. Empty entries and `*` are ignored.                   |
| `PORT`                     | Optional HTTP listen port; defaults to `3001`.                                                               |
| `AUTH_DATABASE_DIRECT_URL` | Migration-only direct database connection. Do not configure it for runtime.                                  |

### RS256 keys

For local development, keep the development private key in the ignored `.env` file and configure its matching public key in the local Game service. The repository does not prescribe a key-generation command; use a private development key pair provisioned for local use. Never commit either key.

Production uses a separate private key configured in the Render web service as `JWT_PRIVATE_KEY`. Configure its matching public key in the production Game service. Never reuse the local key or put a private key in source control, Docker Compose, or Vercel.

## Database and migrations

Neon has separate `develop` and `production` environments with separate credentials. Local feature work and integration use `develop`; the deployed Render service uses `production`. The local Compose in [GameBook.System](https://github.com/CarlosSV923/GameBook.System) can use its local PostgreSQL service instead.

Apply Prisma migrations only through [`.github/workflows/migrate-auth.yml`](../.github/workflows/migrate-auth.yml). Pushes to `develop` that touch migration inputs run against the GitHub `develop` environment; a manual dispatch from `main` runs against `production`. The workflow checks that `AUTH_DATABASE_DIRECT_URL` uses `gamebook_auth_migrator_limited` and targets only the `auth` schema, validates the Prisma schema, and runs `pnpm db:migrate:deploy` twice to verify idempotence. Keep this credential separate from the runtime role. Do not run migrations from Render, Vercel, Docker Compose, or an application startup command.

The Prisma CLI configuration reads `AUTH_DATABASE_DIRECT_URL` for migrations and falls back to `AUTH_DATABASE_URL` for client generation and schema validation. The workflow remains the only approved migration runner.

## Release and deployment

Feature pull requests target `develop`. After local acceptance, changes are promoted from `develop` to `main`. The [release-please workflow](../.github/workflows/release-please.yml) runs on `main` pushes or manual dispatch, opens a release pull request from Conventional Commits, and publishes the GitHub release and version tag when that release pull request is merged.

The Render web service deploys from `main`. Swagger UI is exposed at `/docs`, with OpenAPI JSON at `/docs/openapi.json`. The free tier may take time to respond to its first request. Store runtime configuration and the production signing key in Render; do not add deployment secrets to the repository.

## Docker

This repository contains a production-style [`Dockerfile`](../Dockerfile) that builds the service and starts it on port `3001`. It does not contain a Compose file. For local multi-service integration, use the Compose documented in [GameBook.System](https://github.com/CarlosSV923/GameBook.System); migrations remain explicit and are not run by Compose.

## Quality commands

These commands are defined in [`package.json`](../package.json):

| Command            | What it runs                                                      |
| ------------------ | ----------------------------------------------------------------- |
| `pnpm lint`        | Type-aware Oxlint over `src/` and `tests/`.                       |
| `pnpm test`        | Vitest unit test suite.                                           |
| `pnpm test:watch`  | Vitest unit suite in watch mode.                                  |
| `pnpm test:e2e`    | Vitest integration suite using `vitest.config.e2e.ts`.            |
| `pnpm test:cov`    | Unit suite with Vitest coverage.                                  |
| `pnpm test:debug`  | Vitest with the inspector and file parallelism disabled.          |
| `pnpm db:validate` | Prisma schema validation.                                         |
| `pnpm db:generate` | Prisma Client generation.                                         |
| `pnpm build`       | Generates Prisma Client, then builds the NestJS application.      |
| `pnpm format`      | Formats TypeScript files under `src/` and `tests/` with Prettier. |

CI runs Prisma Client generation, lint, unit tests, integration tests, and the application build.
