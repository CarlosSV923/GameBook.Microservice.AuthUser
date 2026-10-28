# GameBook.Microservice.AuthUser

[Español](README.es.md) · **Status: active — latest release v0.4.0**

[![CI](https://github.com/CarlosSV923/GameBook.Microservice.AuthUser/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/CarlosSV923/GameBook.Microservice.AuthUser/actions/workflows/ci.yml?query=branch%3Amain)

[![GameBook AuthUser architecture](architecture/GameBook.Microservice.AuthUser-architecture-en.svg)](https://carlossv923.github.io/GameBook.Microservice.AuthUser/GameBook.Microservice.AuthUser-architecture-en.html)

GameBook.Microservice.AuthUser manages GameBook accounts and authentication. It stores users in its PostgreSQL schema and issues RS256 JWTs for the frontend and Game service.

## What it does

- Registers accounts and signs users in.
- Validates the current session and changes the signed-in user's password.
- Disables the signed-in user's account and revokes its sessions.
- Exposes health and OpenAPI endpoints.

## Live API

[Swagger UI](https://gamebook-microservice-authuser.onrender.com/docs) · [OpenAPI JSON](https://gamebook-microservice-authuser.onrender.com/docs/openapi.json). The Render free tier may make the first request slow. The [GameBook Frontend](https://gamebook-frontend.vercel.app) is the client.

## Quick development

Requires Node.js 24, pnpm 12.4.1 and a local RS256 key pair (see the development guide).

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm db:generate
cp .env.example .env
pnpm start:dev
```

Add private local values to `.env`; run `pnpm test` for unit tests and `pnpm test:e2e` for integration tests. See [Development](docs/development.md) for configuration, migrations, deployment, and quality commands.

## Architecture

[![Request sequence](architecture/GameBook.Microservice.AuthUser-sequence-en.svg)](https://carlossv923.github.io/GameBook.Microservice.AuthUser/GameBook.Microservice.AuthUser-sequence-en.html)

[Interactive diagrams index](https://carlossv923.github.io/GameBook.Microservice.AuthUser/)

The architecture diagram is at the top of this README. The API layer handles HTTP and validation, application use cases coordinate domain rules, and infrastructure adapters provide Prisma persistence and RS256 signing. Registration and login persist or load a user before issuing a token; protected session and account operations validate that token.

## Stack and decisions

| Technology            | Why                                                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| NestJS and TypeScript | HTTP application and dependency injection                                                                              |
| PostgreSQL and Prisma | Persistence in the AuthUser schema                                                                                     |
| RS256 JWT             | Signed sessions with a session version, so changing the password or disabling the account revokes older tokens at once |
| Swagger and OpenAPI   | API reference at `/docs` and machine-readable contract                                                                 |
| Vitest and Oxlint     | Unit/integration tests and type-aware linting                                                                          |

## Related projects

- [GameBook.System](https://github.com/CarlosSV923/GameBook.System) — system architecture and local integration Compose.
- [GameBook.Microservice.Game](https://github.com/CarlosSV923/GameBook.Microservice.Game) — stores and serves users' favorite games.
- [GameBook.Frontend](https://github.com/CarlosSV923/GameBook.Frontend) — web client for account and game features.

Licensed under the [MIT License](LICENSE). © Carlos Sesme Vera.
