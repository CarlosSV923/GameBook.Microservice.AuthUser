# GameBook.Microservice.AuthUser

[English](README.md) · **Estado: activo — última versión v0.4.0**

[![CI](https://github.com/CarlosSV923/GameBook.Microservice.AuthUser/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/CarlosSV923/GameBook.Microservice.AuthUser/actions/workflows/ci.yml?query=branch%3Amain)

[![Arquitectura de GameBook AuthUser](architecture/GameBook.Microservice.AuthUser-architecture-es.svg)](https://carlossv923.github.io/GameBook.Microservice.AuthUser/GameBook.Microservice.AuthUser-architecture-es.html)

GameBook.Microservice.AuthUser administra las cuentas y la autenticación de GameBook. Guarda usuarios en su esquema PostgreSQL y emite JWT RS256 para el frontend y el servicio Game.

## Qué hace

- Registra cuentas e inicia sesiones.
- Valida la sesión actual y cambia la contraseña de la persona autenticada.
- Desactiva la cuenta de la persona autenticada y revoca sus sesiones.
- Expone los endpoints de salud y OpenAPI.

## API en producción

[Interfaz Swagger](https://gamebook-microservice-authuser.onrender.com/docs) · [JSON OpenAPI](https://gamebook-microservice-authuser.onrender.com/docs/openapi.json). El nivel gratuito de Render puede hacer lenta la primera solicitud. El [Frontend de GameBook](https://gamebook-frontend.vercel.app) es el cliente.

## Desarrollo rápido

Requiere Node.js 24, pnpm 12.4.1 y un par de claves RS256 local (consulta la guía de desarrollo).

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm db:generate
cp .env.example .env
pnpm start:dev
```

Agrega valores locales privados a `.env`; ejecuta `pnpm test` para las pruebas unitarias y `pnpm test:e2e` para las pruebas de integración. Consulta [Desarrollo](docs/development.es.md) para la configuración, las migraciones, el despliegue y los comandos de calidad.

## Arquitectura

[![Secuencia de solicitudes](architecture/GameBook.Microservice.AuthUser-sequence-es.svg)](https://carlossv923.github.io/GameBook.Microservice.AuthUser/GameBook.Microservice.AuthUser-sequence-es.html)

[Índice de diagramas interactivos](https://carlossv923.github.io/GameBook.Microservice.AuthUser/)

El diagrama de arquitectura está al inicio de este README. La capa API gestiona HTTP y la validación; los casos de uso coordinan las reglas de dominio; y los adaptadores de infraestructura proporcionan persistencia Prisma y firma RS256. El registro y el inicio de sesión guardan o consultan un usuario antes de emitir un token; las operaciones protegidas de sesión y cuenta validan ese token.

## Stack y decisiones

| Tecnología          | Motivo                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| NestJS y TypeScript | Aplicación HTTP e inyección de dependencias                                                                                    |
| PostgreSQL y Prisma | Persistencia en el esquema AuthUser                                                                                            |
| JWT RS256           | Sesiones firmadas con versión de sesión: cambiar la contraseña o desactivar la cuenta revoca al instante los tokens anteriores |
| Swagger y OpenAPI   | Referencia de API en `/docs` y contrato legible por máquinas                                                                   |
| Vitest y Oxlint     | Pruebas unitarias/de integración y lint con tipos                                                                              |

## Proyectos relacionados

- [GameBook.System](https://github.com/CarlosSV923/GameBook.System) — arquitectura del sistema y Compose de integración local.
- [GameBook.Microservice.Game](https://github.com/CarlosSV923/GameBook.Microservice.Game) — almacena y sirve los juegos favoritos de las personas usuarias.
- [GameBook.Frontend](https://github.com/CarlosSV923/GameBook.Frontend) — cliente web para las cuentas y las funciones de juegos.

Licencia [MIT](LICENSE). © Carlos Sesme Vera.
