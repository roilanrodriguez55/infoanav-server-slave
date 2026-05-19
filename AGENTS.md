# Agents

## Project

Express + Swagger UI server that manages a PostgREST binary as a child process. The binary (`postgrest` or `postgrest.exe`) serves a PostgreSQL API; Swagger UI reads the OpenAPI spec from PostgREST.

## Dev Commands

- `npm start` — starts PostgREST + Swagger UI (port 8080)
- `npm run db:post-restore:local` — run post-restore SQL + sync auth.login from `postgrest.conf`
- `npm run db:validate` — validate `database-expectations.json`
- `npm run db:ensure-roles` — create missing roles (`anon`, `usuario_comun`, `administrador`)
- `npm run db:verify-grants` — verify role grants match expectations

## Key Files

- `index.js` — entry point; spawns PostgREST (auto-selects `postgrest.exe` on win32, `postgrest` on unix); sets up Swagger UI at `/api-docs`
- `postgrest.conf` — local dev config (port 3000, connects to `localhost:5430`)
- `postgrest-docker.conf` — Docker config (connects to `db:5432`)
- `docker-compose.yml` — full stack: `db` (5437:5432), `postgrest` (3000), `app` (8080)
- `scripts/db.cjs` — reads db-uri and jwt-secret from INI config; uses `psql` CLI
- `scripts/verify-db-expectations.cjs` — uses `psql` CLI with libpq env vars
- `scripts/sql/post-restore.sql` — runs after database restore

## Architecture

- **PostgreSQL schemas**: `api`, `auth`, `public`
- **Roles** (all `NOLOGIN`): `anon`, `usuario_comun`, `administrador`
- **Auth**: `auth.login(usuario, contrasena)` returns JWT; `administrador` role if `cargo_ocupa = 'Administrador'`, else `usuario_comun`
- **`database-expectations.json`**: has two profiles — `restoredFromDump` (pg_restore ACL) and `afterEntrypointAlways` (docker-entrypoint setup); set via `DB_EXPECTATIONS_PROFILE`

## Env Variables

- `SKIP_POSTGREST=true` — skip spawning local PostgREST (use with external/Dockerized instance)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — override DB connection for scripts
- `POSTGREST_URL` — Swagger UI reads spec from here (default `http://localhost:3000`)
- `POSTGREST_CONF` — path to INI config for `db.cjs` (default `postgrest-docker.conf`)