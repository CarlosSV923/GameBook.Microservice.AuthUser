# GameBook.Microservice.AuthUser

[Read this README in Spanish](README.es.md)

`GameBook.Microservice.AuthUser` is the account and authentication service for GameBook, a portfolio project for exploring video games and saving personal favorites.

## Responsibility

The service owns user accounts, login, JWT issuance and validation, session revocation, and password changes. It uses NestJS, Prisma, and PostgreSQL, with DDD-oriented layers and an OpenAPI/Swagger interface.

## Repository status

The AuthUser API is implemented through the account and session flows defined by the MVP contract. Production deployment remains a later SDD task; local validation is the source of truth during development.

## Local development

Install dependencies and generate the Prisma client:

```bash
pnpm install --frozen-lockfile
pnpm db:generate
```

Create a private, ignored `.env` file with the runtime variables `AUTH_DATABASE_URL`, `JWT_PRIVATE_KEY`, `JWT_ISSUER`, and `JWT_AUDIENCE`. `CORS_ALLOWED_ORIGINS` may be set to `http://localhost:3000`. If the Prisma client must be generated locally, make `AUTH_DATABASE_DIRECT_URL` available privately for that command; it is a direct migration connection, never a runtime or deployment variable. Never commit these values.

Start the service with `pnpm start:dev`. AuthUser listens on `http://localhost:3001` by default; set `PORT` only when a different local port is required.

- Swagger UI: `http://localhost:3001/docs`
- OpenAPI JSON: `http://localhost:3001/docs/openapi.json`
- Frontend local URL: `http://localhost:3000`
- Game local URL: `http://localhost:3002`

For local integration, Game should use `AUTHUSER_URL=http://localhost:3001` and the Frontend should use `NEXT_PUBLIC_AUTHUSER_URL=http://localhost:3001`. Both variables contain the AuthUser base URL without the `/v1` suffix.

## Related projects

- [GameBook.Microservice.Game](https://github.com/CarlosSV923/GameBook.Microservice.Game)
- [GameBook.Frontend](https://github.com/CarlosSV923/GameBook.Frontend)
