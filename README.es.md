# GameBook.Microservice.AuthUser

[Leer este README en inglés](README.md)

`GameBook.Microservice.AuthUser` es el servicio de cuentas y autenticación de GameBook, un proyecto de portfolio para explorar videojuegos y guardar favoritos personales.

## Responsabilidad

El servicio es propietario de las cuentas de usuario, el inicio de sesión, la emisión y validación de JWT, la revocación de sesiones y el cambio de contraseña. Usa NestJS, Prisma y PostgreSQL, con capas orientadas a DDD y una interfaz OpenAPI/Swagger.

## Estado del repositorio

La API AuthUser implementa los flujos de cuenta y sesión definidos por el contrato del MVP. El despliegue productivo queda para una tarea SDD posterior; durante el desarrollo, la validación local es la referencia operativa.

## Desarrollo local

Instala las dependencias y genera el cliente de Prisma:

```bash
pnpm install --frozen-lockfile
pnpm db:generate
```

Crea un archivo `.env` privado e ignorado por Git con las variables de runtime `AUTH_DATABASE_URL`, `JWT_PRIVATE_KEY`, `JWT_ISSUER` y `JWT_AUDIENCE`. Puedes configurar `CORS_ALLOWED_ORIGINS` como `http://localhost:3000`. Si necesitas generar localmente el cliente de Prisma, proporciona `AUTH_DATABASE_DIRECT_URL` de forma privada para ese comando; es una conexión directa de migración, nunca una variable de runtime o despliegue. Nunca confirmes estos valores en Git.

Inicia el servicio con `pnpm start:dev`. AuthUser escucha por defecto en `http://localhost:3001`; define `PORT` solo si necesitas otro puerto local.

- Swagger UI: `http://localhost:3001/docs`
- JSON OpenAPI: `http://localhost:3001/docs/openapi.json`
- URL local del Frontend: `http://localhost:3000`
- URL local de Game: `http://localhost:3002`

Para la integración local, Game debe usar `AUTHUSER_URL=http://localhost:3001` y Frontend debe usar `NEXT_PUBLIC_AUTHUSER_URL=http://localhost:3001`. Ambas variables contienen la URL base de AuthUser sin el sufijo `/v1`.

## Proyectos relacionados

- [GameBook.Microservice.Game](https://github.com/CarlosSV923/GameBook.Microservice.Game)
- [GameBook.Frontend](https://github.com/CarlosSV923/GameBook.Frontend)
