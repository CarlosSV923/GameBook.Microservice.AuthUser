# Desarrollo

## Configuración local

Usa Node.js 24 y pnpm 12.4.1 mediante Corepack. Instala las dependencias, crea un `.env` privado desde la plantilla e inicia el servicio:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm db:generate
cp .env.example .env
pnpm start:dev
```

El servicio escucha por defecto en el puerto `3001`. Swagger UI está en `http://localhost:3001/docs`; el JSON OpenAPI, en `http://localhost:3001/docs/openapi.json`. Genera el cliente Prisma después de instalar dependencias y cada vez que cambie el esquema Prisma.

## Variables de entorno

`.env.example` lista los nombres de configuración. Mantén `.env` privado; `.env*` está ignorado salvo la plantilla de ejemplo.

| Variable                   | Significado                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `AUTH_DATABASE_URL`        | Conexión runtime requerida para el esquema PostgreSQL AuthUser. Usa el rol runtime limitado a este esquema.        |
| `JWT_PRIVATE_KEY`          | Clave privada PEM requerida para firmar tokens RS256. Los escapes literales `\n` se convierten en saltos de línea. |
| `JWT_ISSUER`               | Emisor requerido para los tokens firmados.                                                                         |
| `JWT_AUDIENCE`             | Audiencia requerida para los tokens firmados.                                                                      |
| `CORS_ALLOWED_ORIGINS`     | Lista opcional de orígenes de navegador exactos, separados por comas. Se ignoran las entradas vacías y `*`.        |
| `PORT`                     | Puerto HTTP opcional; por defecto es `3001`.                                                                       |
| `AUTH_DATABASE_DIRECT_URL` | Conexión directa a la base de datos exclusiva de migraciones. No la configures para runtime.                       |

### Claves RS256

Para desarrollo local, guarda la clave privada de desarrollo en el `.env` ignorado y configura su clave pública correspondiente en el servicio Game local. Este repositorio no prescribe un comando para generar claves; usa un par de desarrollo aprovisionado de forma privada. Nunca confirmes ninguna de las claves.

Producción usa una clave privada distinta, configurada en el servicio web de Render como `JWT_PRIVATE_KEY`. Configura su clave pública correspondiente en el servicio Game de producción. No reutilices la clave local ni pongas una clave privada en el control de versiones, Docker Compose o Vercel.

## Base de datos y migraciones

Neon tiene entornos separados `develop` y `production`, con credenciales distintas. El trabajo local de funcionalidades y la integración usan `develop`; el servicio desplegado en Render usa `production`. El Compose local de [GameBook.System](https://github.com/CarlosSV923/GameBook.System) también puede usar su servicio PostgreSQL local.

Aplica migraciones Prisma únicamente mediante [`.github/workflows/migrate-auth.yml`](../.github/workflows/migrate-auth.yml). Los pushes a `develop` que cambian archivos de migración ejecutan el workflow en el entorno GitHub `develop`; una ejecución manual desde `main` usa `production`. El workflow comprueba que `AUTH_DATABASE_DIRECT_URL` use `gamebook_auth_migrator_limited` y se dirija solo al esquema `auth`, valida el esquema Prisma y ejecuta `pnpm db:migrate:deploy` dos veces para verificar la idempotencia. Mantén esta credencial separada del rol runtime. No ejecutes migraciones desde Render, Vercel, Docker Compose ni al iniciar la aplicación.

La configuración de Prisma CLI lee `AUTH_DATABASE_DIRECT_URL` para migraciones y usa `AUTH_DATABASE_URL` como alternativa para generar el cliente y validar el esquema. El workflow sigue siendo el único ejecutor de migraciones autorizado.

## Release y despliegue

Los pull requests de funcionalidades apuntan a `develop` y se fusionan con **Rebase and merge**, para que release-please liste cada cambio una sola vez. Después de la aceptación local, los cambios se promueven de `develop` a `main`. El [workflow release-please](../.github/workflows/release-please.yml) se ejecuta con pushes a `main` o manualmente, abre un pull request de release a partir de Conventional Commits y publica el release de GitHub y la etiqueta de versión cuando se fusiona ese pull request.

Los pull requests de promoción de `develop` a `main` y de sincronización de `main` a `develop` se fusionan con merge commit. Después de cada release, el workflow abre un pull request de sincronización de `main` a `develop`.

El servicio web de Render se despliega desde `main`. Swagger UI está disponible en `/docs` y el JSON OpenAPI en `/docs/openapi.json`. El nivel gratuito puede tardar en responder a la primera solicitud. Guarda la configuración runtime y la clave de firma de producción en Render; no agregues secretos de despliegue al repositorio.

## Docker

Este repositorio contiene un [`Dockerfile`](../Dockerfile) de estilo productivo que compila el servicio y lo inicia en el puerto `3001`. No contiene un archivo Compose. Para la integración local de varios servicios, usa el Compose documentado en [GameBook.System](https://github.com/CarlosSV923/GameBook.System); Compose no ejecuta las migraciones, que siguen siendo explícitas.

## Comandos de calidad

Estos comandos están definidos en [`package.json`](../package.json):

| Comando            | Qué ejecuta                                                         |
| ------------------ | ------------------------------------------------------------------- |
| `pnpm lint`        | Oxlint con tipos sobre `src/` y `tests/`.                           |
| `pnpm test`        | Suite de pruebas unitarias de Vitest.                               |
| `pnpm test:watch`  | Suite unitaria de Vitest en modo watch.                             |
| `pnpm test:e2e`    | Suite de integración de Vitest con `vitest.config.e2e.ts`.          |
| `pnpm test:cov`    | Suite unitaria con cobertura de Vitest.                             |
| `pnpm test:debug`  | Vitest con inspector y sin paralelismo de archivos.                 |
| `pnpm db:validate` | Validación del esquema Prisma.                                      |
| `pnpm db:generate` | Generación del cliente Prisma.                                      |
| `pnpm build`       | Genera el cliente Prisma y luego compila la aplicación NestJS.      |
| `pnpm format`      | Formatea con Prettier los archivos TypeScript de `src/` y `tests/`. |

CI ejecuta la generación del cliente Prisma, lint, pruebas unitarias, pruebas de integración y compilación de la aplicación.
