# AGENTS.md

## Proyecto

Gateway en Node.js y TypeScript sobre PostgREST y PostgreSQL. Node autentica y autoriza cada peticion. PostgREST escucha solo en 127.0.0.1 y nunca se expone. El servidor no sirve el cliente.

## Comandos

- `npm start`: aplica migraciones, crea el admin inicial si corresponde, lanza PostgREST y arranca el servidor.
- `npm run dev`: igual que `start`, con recarga al guardar.
- `npm run typecheck`: `tsc --noEmit`, unico chequeo de tipos.
- `npm run migrate` y `npm run migrate:status`: aplicar y revisar migraciones.
- `npm run migration:new -- nombre_snake_case`: crea la carpeta de una migracion.

## Codigo

- TypeScript sin build: Node 24 ejecuta los `.ts`. Imports con extension `.ts`.
- Prohibido: `enum`, `namespace`, parameter properties y `any`. Mensajes y comentarios en espanol.

## Migraciones

- SQL plano en `prisma/migrations/<timestamp>_<nombre>/migration.sql`.
- Una migracion aplicada no se edita nunca. Un cambio nuevo va en otra migracion.
- Idempotentes cuando se pueda (`IF NOT EXISTS`, `DROP ... IF EXISTS`, `CREATE OR REPLACE`). Un cambio logico por migracion.
- Todo cambio en `api` termina con `NOTIFY pgrst, 'reload schema';`.
- Tabla operativa nueva: columnas de auditoria, trigger `trg_set_audit_fields` y regla `rl_soft_delete` con `RETURNING *`.

## Donde esta cada cosa

- `src/config/env.ts`: variables. `src/app.ts`: rutas y middlewares. `src/start.ts`: arranque y apagado.
- `src/modules/{auth,users,data}`: modulos. La matriz de permisos esta en `src/modules/data/policy.ts`. Tokens en `src/lib/tokens.ts`.
- `docs/postgrest.md`: guia de PostgREST. `README.md`: instalacion, produccion y flujo de desarrollo.

## No hacer

- No publicar ni enlazar PostgREST fuera de 127.0.0.1.
- No editar migraciones ya aplicadas ni tocar `policy.ts` sin revisar la matriz en `README.md`, seccion 5.
- No anadir RLS, roles de PostgreSQL ni JWT nuevos sin leer `docs/postgrest.md`.
- No subir `.env` ni secretos.
