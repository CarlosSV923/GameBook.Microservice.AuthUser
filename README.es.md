# GameBook.Microservice.AuthUser

[Leer este README en inglés](README.md)

`GameBook.Microservice.AuthUser` es el servicio de cuentas y autenticación de GameBook. Administra las cuentas, credenciales, sesiones, emisión de JWT y cambios de contraseña de la aplicación de portfolio.

## Responsabilidad

AuthUser es propietario del registro, inicio de sesión, validación de sesión actual, cambios de contraseña, firma JWT y revocación de sesiones. Persiste usuarios en su propio esquema PostgreSQL mediante Prisma y publica un contrato OpenAPI/Swagger. Los JWT usan RS256, expiran después de una hora y son consumidos por el frontend y el servicio Game.

## Arquitectura implementada

- `src/api/` — controladores HTTP, validación, CORS, IDs de solicitud, mapeo de excepciones y Swagger/OpenAPI.
- `src/application/` — casos de uso, puertos de aplicación y tokens de dependencias.
- `src/domain/` — entidades de usuario, políticas de email y contraseña, repositorios y errores de dominio.
- `src/infrastructure/` — persistencia Prisma, criptografía, configuración de runtime y adaptadores.
- `src/main.ts` — arranque de la aplicación, configuración HTTP y documentación.

El acceso runtime a la base de datos usa `AUTH_DATABASE_URL`. Las migraciones Prisma usan `AUTH_DATABASE_DIRECT_URL` por separado y únicamente desde comandos de migración controlados o Actions; las credenciales de migración no son credenciales runtime.

## Configuración local

Requisitos previos:

- Node.js 24 o una versión LTS compatible.
- pnpm 12.4.1 mediante Corepack.
- Un rol local de prueba para la base de datos y una clave privada RS256 correspondiente a la clave pública configurada en Game.

Instala las dependencias y genera el cliente Prisma:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm db:generate
```

Copia `.env.example` a un archivo `.env` privado e ignorado por Git y completa solo los valores locales. La plantilla muestra los nombres de variables sin valores:

```dotenv
AUTH_DATABASE_URL=
JWT_PRIVATE_KEY=
JWT_ISSUER=
JWT_AUDIENCE=
CORS_ALLOWED_ORIGINS=
PORT=
```

La plantilla también muestra `AUTH_DATABASE_DIRECT_URL` como variable exclusiva de migración. Proporciónala de forma privada solo al ejecutar comandos de migración Prisma; no es una credencial de runtime ni de despliegue. Los valores PEM pueden usar escapes literales `\n`; el servicio los normaliza antes de analizarlos. Nunca confirmes archivos `.env`, claves privadas ni credenciales de base de datos.

Inicia AuthUser de forma individual:

```bash
pnpm start:dev
```

AuthUser escucha por defecto en el puerto local 3001.

## Endpoints locales

| Recurso | URL |
| --- | --- |
| URL base del servicio | `http://localhost:3001` |
| Swagger UI | `http://localhost:3001/docs` |
| JSON OpenAPI | `http://localhost:3001/docs/openapi.json` |
| Frontend | `http://localhost:3000` |
| Game | `http://localhost:3002` |

Game y el frontend usan la URL base de AuthUser sin el sufijo `/v1`. Las llamadas autenticadas llevan el JWT en `Authorization: Bearer <token>`.

## Pruebas y comprobaciones de calidad

```bash
pnpm test
pnpm test:e2e
pnpm lint
pnpm exec tsc --noEmit -p tsconfig.build.json
pnpm build
```

## Proyectos relacionados

- [GameBook.Microservice.Game](https://github.com/CarlosSV923/GameBook.Microservice.Game)
- [GameBook.Frontend](https://github.com/CarlosSV923/GameBook.Frontend)
