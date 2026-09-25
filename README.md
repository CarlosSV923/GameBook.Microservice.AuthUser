# GameBook.Microservice.AuthUser

[Read this README in Spanish](README.es.md)

`GameBook.Microservice.AuthUser` is the GameBook account and authentication service. It manages user accounts, credentials, sessions, JWT issuance, and password changes for the portfolio application.

## Responsibility

AuthUser owns registration, login, current-session validation, password changes, JWT signing and session revocation. It persists users in its own PostgreSQL schema through Prisma and publishes an OpenAPI/Swagger contract. JWTs use RS256, expire after one hour, and are consumed by the frontend and Game service.

## Implemented architecture

- `src/api/` — HTTP controllers, validation, CORS, request IDs, exception mapping, and Swagger/OpenAPI.
- `src/application/` — use cases, application ports, and dependency tokens.
- `src/domain/` — user entities, email and password policies, repositories, and domain errors.
- `src/infrastructure/` — Prisma persistence, cryptography, runtime configuration, and adapters.
- `src/main.ts` — application bootstrap, HTTP configuration, and documentation setup.

Runtime database access uses `AUTH_DATABASE_URL`. Prisma migrations use the separate `AUTH_DATABASE_DIRECT_URL` only from controlled migration commands or Actions; migration credentials are not runtime credentials.

## Local setup

Prerequisites:

- Node.js 24 or a compatible LTS version.
- pnpm 12.4.1 through Corepack.
- A local test database role and an RS256 private key corresponding to the public key configured in Game.

Install dependencies and generate the Prisma client:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm db:generate
```

Create a private, ignored `.env` file. The variable names are listed without values:

```dotenv
AUTH_DATABASE_URL=
JWT_PRIVATE_KEY=
JWT_ISSUER=
JWT_AUDIENCE=
CORS_ALLOWED_ORIGINS=
PORT=
```

`AUTH_DATABASE_DIRECT_URL` is required only by Prisma migration commands and must remain outside runtime environment files. PEM values may use literal `\n` escapes; the service normalizes them before parsing. Never commit environment files, private keys, or database credentials.

Start AuthUser individually:

```bash
pnpm start:dev
```

AuthUser listens on local port 3001 by default.

## Local endpoints

| Resource | URL |
| --- | --- |
| Service base URL | `http://localhost:3001` |
| Swagger UI | `http://localhost:3001/docs` |
| OpenAPI JSON | `http://localhost:3001/docs/openapi.json` |
| Frontend | `http://localhost:3000` |
| Game | `http://localhost:3002` |

Game and the frontend use the AuthUser base URL without the `/v1` suffix. Authenticated calls carry the JWT in `Authorization: Bearer <token>`.

## Tests and quality checks

```bash
pnpm test
pnpm test:e2e
pnpm lint
pnpm exec tsc --noEmit -p tsconfig.build.json
pnpm build
```

## Related projects

- [GameBook.Microservice.Game](https://github.com/CarlosSV923/GameBook.Microservice.Game)
- [GameBook.Frontend](https://github.com/CarlosSV923/GameBook.Frontend)
