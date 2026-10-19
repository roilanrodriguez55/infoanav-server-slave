# AGENTS.md

## Proyecto

Gateway en Node.js y TypeScript sobre PostgREST y PostgreSQL. Node autentica y autoriza cada peticion. PostgREST escucha solo en 127.0.0.1 y nunca se expone. El servidor no sirve el cliente.

## Comandos

- `npm start`: aplica migraciones, crea el admin inicial si corresponde, lanza PostgREST y arranca el servidor.
- `npm run dev`: igual que `start`, con recarga al guardar.
- `npm run typecheck`: `tsc --noEmit`, unico chequeo de tipos.
- `npm run migrate:create -- --name nombre_snake_case`: genera una migracion desde `prisma/schema.prisma` sin aplicarla.
- `npm run migrate:dev` (solo desarrollo) y `npm run migrate` (produccion), mas `npm run migrate:status`: aplicar y revisar migraciones.
- `npm run migration:new -- nombre_snake_case`: crea la carpeta de una migracion con SQL vacio, para cambios que no tocan tablas.
- `npm run schema:validate` y `npm run schema:format`: validar y formatear el schema.

## Codigo

- TypeScript sin build: Node 24 ejecuta los `.ts`. Imports con extension `.ts`.
- Prohibido: `enum`, `namespace`, parameter properties y `any`. Mensajes y comentarios en espanol.

## Migraciones

- El modelo de datos esta en `prisma/schema.prisma`: modelos de `api` y `auth`, multiSchema. El bloque `generator` existe solo para habilitar `partialIndexes`. Un cambio de tabla empieza ahi, no con `CREATE TABLE` a mano.
- Flujo: editar el schema, `npm run migrate:create -- --name <nombre>`, revisar el SQL y completar a mano lo que Prisma no modela (funciones, triggers, vistas, grants, reglas).
- Migraciones en `prisma/migrations/<timestamp>_<nombre>/migration.sql`. Las 14 existentes son historial.
- Una migracion aplicada no se edita nunca. Un cambio nuevo va en otra migracion.
- `migrate:dev` solo en desarrollo, nunca contra produccion.
- Idempotentes cuando se pueda (`IF NOT EXISTS`, `DROP ... IF EXISTS`, `CREATE OR REPLACE`). Un cambio logico por migracion.
- Todo cambio en `api` termina con `NOTIFY pgrst, 'reload schema';`.
- Tabla operativa nueva: columnas de auditoria, trigger `trg_set_audit_fields` y regla `rl_soft_delete` con `RETURNING *`.
- Toda migracion que anada columnas a una tabla con `rl_soft_delete` recrea la regla al final, con el mismo bloque `DO` de `20261016173527_recrear_reglas_soft_delete`. Si no, el `DELETE` falla por la lista de columnas desactualizada.

## Donde esta cada cosa

- `src/config/env.ts`: variables. `src/app.ts`: rutas y middlewares. `src/start.ts`: arranque y apagado.
- `src/modules/{auth,users,data}`: modulos. La matriz de permisos esta en `src/modules/data/policy.ts`. Tokens en `src/lib/tokens.ts`.
- `docs/tecnica/02-servidor-avanzado.md`: configuracion avanzada y guia de PostgREST. `README.md`: instalacion, produccion y flujo de desarrollo.

## No hacer

- No publicar ni enlazar PostgREST fuera de 127.0.0.1.
- No editar migraciones ya aplicadas ni tocar `policy.ts` sin revisar la matriz en `README.md`, seccion 5.
- No anadir RLS, roles de PostgreSQL ni JWT nuevos sin leer `docs/tecnica/02-servidor-avanzado.md` (seccion 5).
- No subir `.env` ni secretos.
