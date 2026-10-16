# infoanav-server

## 1. Que es

Gateway en Node.js y TypeScript que se pone delante de PostgREST y PostgreSQL. Node se encarga de la autenticacion (login, tokens y sesiones) y de la autorizacion (que recurso y que metodo puede usar cada rol). PostgREST nunca se expone: escucha solo en 127.0.0.1 y el unico que le habla es el gateway.

El servidor no sirve el cliente. El frontend se despliega aparte (ver la seccion 6).

```
Cliente --HTTP--> Node (gateway, :8080) --HTTP--> PostgREST (127.0.0.1:3000) --SQL--> PostgreSQL
                       |                                                              ^
                       +------- SQL directo (login, refresh, usuarios y health) -------+
```

Las rutas `/api/data/*` pasan por Node hacia PostgREST. Las rutas `/api/auth/*` y `/api/users/*` hablan con PostgreSQL directamente, sin PostgREST.

## 2. Requisitos

- Node.js 24 o superior (`engines` en `package.json`). El arranque ejecuta los `.ts` directamente, sin paso de compilacion.
- PostgreSQL 17 recomendado. Es la version con la que se probaron las migraciones.
- Binario de PostgREST v14.x. El Dockerfile usa la 14.7.
- Una cuenta de base de datos que pueda crear o usar el rol `api_service` durante las migraciones. Ver la seccion 6, paso 3.
- `openssl` para generar secretos.
- Docker solo si se quiere el stack de desarrollo o demos (seccion 8).

## 3. Variables de entorno

Se leen desde `.env` en la raiz del proyecto (copia `.env.example`) o desde el entorno del proceso. Si una variable tiene la cadena vacia, cuenta como no definida. Las variables que empiezan por `JWT_` y `POSTGREST_JWT_` necesitan al menos 32 caracteres.

| Variable | Requerida | Por defecto | Descripcion |
|---|---|---|---|
| `DATABASE_URL` | Si | - | Cadena de conexion a PostgreSQL. La usan Prisma (migraciones), el gateway y PostgREST. |
| `PORT` | No | `8080` | Puerto HTTP del gateway. Escucha en todas las interfaces. |
| `NODE_ENV` | No | `development` | `development`, `production` o `test`. Con `production`, `COOKIE_SECURE` vale `true` si no se define. |
| `JWT_ACCESS_SECRET` | Si | - | Secreto HS256 que firma los access token. Minimo 32 caracteres. |
| `ACCESS_TOKEN_TTL` | No | `15m` | Vida del access token, en formato de jsonwebtoken (`15m`, `1h`). |
| `REFRESH_TOKEN_TTL_DAYS` | No | `7` | Dias de vida del refresh token. |
| `COOKIE_SECURE` | No | `true` en `production`, `false` en otro caso | Marca la cookie de refresh como `Secure`. Usar `true` solo con HTTPS. |
| `CORS_ORIGIN` | No | vacio (sin CORS) | Origenes permitidos, separados por comas. Cada origen incluye esquema y puerto, sin barra final. |
| `POSTGREST_URL` | No | `http://127.0.0.1:3000` | URL donde escucha PostgREST. |
| `POSTGREST_JWT_SECRET` | Si | - | Secreto con el que PostgREST valida el JWT interno. Minimo 32 caracteres. Si PostgREST corre aparte, debe ser el mismo. |
| `START_POSTGREST` | No | `true` | `true`: el gateway lanza PostgREST como proceso hijo. `false`: PostgREST corre por su cuenta. |
| `POSTGREST_BIN` | No | `./bin/postgrest` | Ruta al binario de PostgREST cuando `START_POSTGREST=true`. |
| `ADMIN_USER` | No | vacio | Usuario del administrador inicial. Debe definirse junto con `ADMIN_PASSWORD`. Solo se crea si no hay ningun administrador activo. |
| `ADMIN_PASSWORD` | No | vacio | Contrasena del administrador inicial. Entre 8 caracteres y 72 bytes. |
| `ENABLE_DOCS` | No | `false` | Expone Swagger UI en `/api/docs`. Solo para desarrollo. |
| `TRUST_PROXY` | No | `0` | Numero de proxies de confianza delante del gateway. Detras de nginx, `1`. Sin esto, el limite de intentos ve la IP del proxy. |

`DB_HOST_PORT` y `API_HOST_PORT` no las lee el gateway. Solo las usa `docker-compose.yml` para publicar puertos.

## 4. Autenticacion

- Login: `POST /api/auth/login` con `{ "usuario", "contrasena" }`. Responde `{ "accessToken", "usuario" }` y deja la cookie de refresh.
- Access token: JWT HS256 con vida de 15 minutos (`ACCESS_TOKEN_TTL`). Lleva `sub`, `usuario`, `rol` y el emisor `infoanav`. El cliente lo guarda en memoria, no en `localStorage`, y lo envia como `Authorization: Bearer <token>`.
- Refresh token: 64 bytes aleatorios en base64url, opacos para el cliente. La base de datos guarda solo su hash SHA-256 en `auth.refresh_tokens`. Vive `REFRESH_TOKEN_TTL_DAYS` dias.
- Cookie de refresh: `httpOnly`, `SameSite=Strict`, `path=/api/auth`, `Secure` segun `COOKIE_SECURE`.
- Refresh: `POST /api/auth/refresh` lee la cookie, marca el token usado como reemplazado, emite otro en la misma familia y devuelve un access token nuevo. Cada uso rota el token.
- Reuso: si llega un refresh token ya usado o revocado, se revoca toda la familia. Todas las sesiones derivadas de ese login quedan cerradas y hay que volver a iniciar sesion.
- Logout: `POST /api/auth/logout` revoca el refresh token de la cookie, borra la cookie y responde 204.
- Usuario actual: `GET /api/auth/me` con access token.
- Cambios que cierran sesiones: cambiar la contrasena o el rol de un usuario, o darlo de baja, revoca sus refresh tokens.
- Limite de intentos: 10 intentos fallidos de login por IP cada 15 minutos. Los exitosos no cuentan. Al superarlo responde 429.
- Purga: cada 6 horas se borran los refresh tokens caducados hace mas de un dia.

Limitaciones conocidas:

- Dos pestanas que refrescan a la vez con la misma cookie cierran la sesion. La segunda llega con un token ya usado, el gateway lo trata como reuso y revoca la familia. No hay periodo de gracia.
- Un access token ya emitido sigue valido hasta 15 minutos despues de una baja o de un cambio de rol. El rol viaja dentro del token y el gateway no consulta la base de datos en cada peticion a `/api/data`.
- Las listas (`GET` sobre una tabla) con `Prefer: count=exact` responden `206 Partial Content` cuando la pagina no cubre todo el resultado. La cabecera `Content-Range` indica el tramo y el total. Sin `count=exact`, el total aparece como `*` y la respuesta es `200`. El cliente debe tratar `200` y `206` como exito.

## 5. Permisos

Los permisos estan en `src/modules/data/policy.ts`. La tabla resume la matriz:

| Recurso | Clase | Lectura (GET, HEAD) | Escritura (POST, PATCH, DELETE) |
|---|---|---|---|
| `senales`, `fallas`, `mantenimientos`, `equipamientos_senal` | operativo | usuario y administrador | usuario y administrador |
| 21 catalogos (`caracteristicas`, `categorias`, `colores`, `colores_luz`, `empresas`, `energias`, `estaciones`, `estados`, `estados_senal`, `formas`, `marcas_tope`, `mares`, `materiales`, `modelos_senal`, `origenes_falla`, `tipos_equipamiento`, `tipos_falla`, `tipos_mantenimiento`, `tipos_senal`, `usuarios_navegacion`, `zonas`) | catalogo | usuario y administrador | solo administrador |
| `historial_cambios` | historial | usuario y administrador | nadie (403) |
| `rpc/get_dashboard_stats`, `rpc/get_fault_analytics`, `rpc/get_status_by_zone` | rpc | solo `POST` | usuario y administrador |

Reglas que aplica el gateway antes de reenviar:

- Recurso fuera de la lista: 404.
- Metodo no permitido para esa clase (por ejemplo `GET` sobre `/rpc/...` o `PUT` en cualquier sitio): 405.
- `PATCH` o `DELETE` sin filtro: 400. Los parametros `select`, `order`, `limit`, `offset`, `columns` y `on_conflict` no cuentan como filtro.
- Escritura sin permiso para el rol: 403.

Roles:

- `administrador`: todo lo anterior, mas la gestion de usuarios.
- `usuario`: lectura de todo, escritura en recursos operativos y RPC. No escribe catalogos ni historial.

Endpoints:

| Ruta | Acceso | Notas |
|---|---|---|
| `/api/auth` | Login publico. `me` pide token. | `login`, `refresh`, `logout`, `me`. |
| `/api/users` | Solo administrador. | `GET` (`?incluir_bajas=true`), `POST`, `PATCH /:id`, `DELETE /:id` (baja logica). El usuario se valida con 3 a 50 caracteres (letras, numeros, `.`, `_`, `-`). La contrasena, con 8 a 72. |
| `/api/data` | Token valido. | Proxy hacia PostgREST con la matriz anterior. El cuerpo admite hasta 5 MB. |
| `/api/health` | Publico. | Responde 200 si la base de datos y PostgREST contestan, 503 si no. Devuelve `{ status, db, postgrest }`. |
| `/api/docs` | Solo con `ENABLE_DOCS=true`. | Swagger UI sobre la especificacion de PostgREST. Solo desarrollo. Con docs activas, la CSP de Helmet se desactiva. |

Cualquier ruta no declarada responde 404 en JSON.

## 6. Produccion sin Docker

Docker no se usa en produccion. Los pasos siguientes asumen un servidor Linux con systemd y nginx.

1. Instalar Node.js 24. Comprobar con `node -v`, que debe mostrar `v24.x`.

2. Instalar PostgreSQL 17 con los paquetes de la distribucion o el repositorio oficial de PostgreSQL.

3. Crear el rol `api_service`, la cuenta de la aplicacion y la base de datos. La primera migracion crea `api_service` si no existe y le concede su membresia a la cuenta de `DATABASE_URL`. Esa concesion exige que la cuenta tenga la opcion de administrar el rol, por eso la forma verificada es crear el rol antes:

```sh
sudo -u postgres psql -c "CREATE ROLE api_service NOLOGIN;"
sudo -u postgres psql -c "CREATE ROLE infoanav LOGIN PASSWORD 'cambia-esta-clave';"
sudo -u postgres psql -c "CREATE DATABASE infoanav OWNER infoanav;"
sudo -u postgres psql -c "GRANT api_service TO infoanav WITH ADMIN OPTION;"
```

   Con `CREATEROLE` en la cuenta, la primera migracion puede crear `api_service` por si sola. Esa variante no se probo de punta a punta con PostgreSQL 17.

4. Copiar el proyecto al servidor (por ejemplo `/opt/infoanav-server`) e instalar dependencias de produccion:

```sh
cd /opt/infoanav-server
npm ci --omit=dev
```

5. Descargar PostgREST v14.x desde https://github.com/PostgREST/postgrest/releases. El archivo para Linux x86-64 se llama `postgrest-v14.7-linux-static-x86-64.tar.xz` y contiene solo el binario `postgrest`:

```sh
mkdir -p bin
curl -L -o /tmp/postgrest.tar.xz https://github.com/PostgREST/postgrest/releases/download/v14.7/postgrest-v14.7-linux-static-x86-64.tar.xz
tar -xJf /tmp/postgrest.tar.xz -C bin
chmod 0755 bin/postgrest
bin/postgrest --version
```

6. Preparar `.env` con secretos largos y propios:

```sh
cp .env.example .env
openssl rand -hex 32   # valor para JWT_ACCESS_SECRET
openssl rand -hex 32   # valor para POSTGREST_JWT_SECRET
```

   Valores que hay que ajustar en `.env`:

```
DATABASE_URL=postgresql://infoanav:cambia-esta-clave@127.0.0.1:5432/infoanav
NODE_ENV=production
COOKIE_SECURE=true
TRUST_PROXY=1
ENABLE_DOCS=false
CORS_ORIGIN=
ADMIN_USER=admin
ADMIN_PASSWORD=una-contrasena-larga
```

   `ADMIN_USER` y `ADMIN_PASSWORD` solo tienen efecto mientras no exista un administrador activo. Despues de la primera ejecucion se pueden quitar del `.env`.

7. Arrancar con `npm start`. Este comando aplica las migraciones (`prisma migrate deploy`), crea el administrador inicial si corresponde, lanza PostgREST y empieza a escuchar en `PORT`. Si una migracion falla, el servidor no arranca. Comprobar:

```sh
curl -s http://127.0.0.1:8080/api/health
```

   El gateway escucha en todas las interfaces. Con un firewall, deja el puerto 8080 accesible solo desde nginx.

8. Unidad de systemd de ejemplo (`/etc/systemd/system/infoanav.service`). Ajusta la ruta de node con `command -v node`:

```ini
[Unit]
Description=infoanav gateway
After=network-online.target postgresql.service
Wants=network-online.target

[Service]
Type=simple
User=infoanav
WorkingDirectory=/opt/infoanav-server
ExecStart=/usr/bin/node src/start.ts
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

   Activar con `sudo systemctl enable --now infoanav`. Al recibir SIGTERM, el gateway cierra el servidor HTTP y apaga PostgREST.

9. Bloque de nginx de ejemplo con HTTPS. Sirve el build del cliente en `/` y envia `/api` al gateway:

```nginx
server {
    listen 80;
    server_name app.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.example.com;

    ssl_certificate     /etc/letsencrypt/live/app.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;

    root /var/www/infoanav-client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 6m;
    }
}
```

   Con este esquema, el cliente llama a `/api` en el mismo dominio y no necesita CORS. `COOKIE_SECURE=true` exige HTTPS en el navegador, y `TRUST_PROXY=1` hace que el limite de intentos use la IP real.

10. Dominios separados. Si el cliente vive en `app.example.com` y la API en `api.example.com` (mismo sitio, distinto subdominio):

- En el build del cliente: `VITE_API_URL=https://api.example.com`, absoluta.
- En `.env` del gateway: `CORS_ORIGIN=https://app.example.com`.
- El cliente envia las peticiones con credenciales incluidas, porque la cookie de refresh viaja con ellas.
- `SameSite=Strict` permite la cookie entre subdominios del mismo sitio. Si los dominios son de sitios distintos (por ejemplo `example.com` y `otro.com`), el navegador no envia la cookie y el refresh falla. Ese caso no esta soportado.

11. Respaldo y restauracion. Usa `pg_dump` de la misma version mayor que el servidor (17):

```sh
pg_dump --format=custom --file=/var/backups/infoanav-$(date +%F).dump "postgresql://infoanav:cambia-esta-clave@127.0.0.1:5432/infoanav"
pg_restore --dbname="postgresql://infoanav:cambia-esta-clave@127.0.0.1:5432/infoanav_nueva" /var/backups/infoanav-2026-10-16.dump
```

    La restauracion va sobre una base vacia (`infoanav_nueva`, creada con `CREATE DATABASE infoanav_nueva OWNER infoanav;`). Despues de restaurar, comprobar con `npm run migrate:status`. El flujo de restauracion no se ha probado de punta a punta en este proyecto.

12. Migrar una base de datos existente. Una base que ya tiene las tablas (por ejemplo, restaurada de un dump anterior a las migraciones) hace fallar `migrate deploy` con P3018 y el codigo 42723 (objeto ya existente). Para esas bases:

    a. Marcar como aplicadas las migraciones cuyo efecto ya existe. Prisma las registra sin ejecutarlas:

```sh
npx prisma migrate resolve --applied 20260101000000_baseline
npx prisma migrate resolve --applied 20260101000100_auth_refresh_tokens
npx prisma migrate resolve --applied 20260101000200_api_service_access
npx prisma migrate resolve --applied 20260101000300_audit_history
npx prisma migrate resolve --applied 20260101000400_catalog_guards_indexes
```

    b. La sexta, `20260101000500_soft_delete_returning`, cambia la regla `rl_soft_delete` de todas las tablas de `api` para anadir `RETURNING *`. Sin ese cambio, cada `DELETE` falla con "cannot perform DELETE RETURNING". No la marques como aplicada a ciegas. Comprueba si hace falta:

```sh
psql "$DATABASE_URL" -Atc "SELECT tablename FROM pg_rules WHERE schemaname = 'api' AND rulename = 'rl_soft_delete' AND definition NOT LIKE '%RETURNING%';"
```

    Si la consulta devuelve filas, deja que `npm run migrate` la aplique. Es idempotente, asi que ejecutarla de mas no hace dano.

    c. Ejecutar `npm run migrate` y luego `npm run migrate:status`, que debe responder `Database schema is up to date!`.

Si una migracion queda en estado fallido (P3009 en el siguiente intento), ver la seccion 10.

## 7. Flujo de desarrollo: ejemplo completo

Ejemplo: crear la tabla `api.inspecciones` (una inspeccion por senal) y la funcion `api.contar_inspecciones_por_senal()`. El SQL y los comandos se probaron contra un PostgreSQL 17 temporal con las 6 migraciones originales, y las peticiones curl contra un gateway local arrancado con `npm start`.

1. Crear la carpeta de la migracion:

```sh
npm run migration:new -- crear_inspecciones
```

   Imprime la ruta, por ejemplo `prisma/migrations/20261016121228_crear_inspecciones/migration.sql`. La fecha de la carpeta es UTC y sirve para ordenar.

2. Escribir el SQL en ese archivo:

```sql
-- Migracion: crear_inspecciones
-- Tabla de inspecciones por senal, con auditoria, baja logica y funcion de conteo.

CREATE TABLE IF NOT EXISTS api.inspecciones (
  id_inspeccion uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_senal uuid NOT NULL REFERENCES api.senales (id_senal),
  fecha timestamp without time zone,
  observaciones text,
  created_at timestamp with time zone DEFAULT now(),
  created_by text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by text,
  deleted_at timestamp with time zone,
  deleted_by text
);

CREATE INDEX IF NOT EXISTS idx_inspecciones_id_senal ON api.inspecciones (id_senal);

DROP TRIGGER IF EXISTS trg_set_audit_fields ON api.inspecciones;
CREATE TRIGGER trg_set_audit_fields BEFORE INSERT OR UPDATE ON api.inspecciones
  FOR EACH ROW EXECUTE FUNCTION api.set_audit_fields();

DROP TRIGGER IF EXISTS trg_log_changes ON api.inspecciones;
CREATE TRIGGER trg_log_changes AFTER INSERT OR UPDATE ON api.inspecciones
  FOR EACH ROW EXECUTE FUNCTION api.log_changes('id_inspeccion');

DROP RULE IF EXISTS rl_soft_delete ON api.inspecciones;
CREATE RULE rl_soft_delete AS ON DELETE TO api.inspecciones DO INSTEAD
  UPDATE api.inspecciones SET deleted_at = now() WHERE id_inspeccion = old.id_inspeccion RETURNING *;

CREATE OR REPLACE FUNCTION api.contar_inspecciones_por_senal()
RETURNS TABLE (id_senal uuid, total bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT i.id_senal, count(*)
  FROM api.inspecciones i
  WHERE i.deleted_at IS NULL
  GROUP BY i.id_senal;
$$;

REVOKE EXECUTE ON FUNCTION api.contar_inspecciones_por_senal() FROM PUBLIC;

GRANT ALL ON api.inspecciones TO api_service;
GRANT EXECUTE ON FUNCTION api.contar_inspecciones_por_senal() TO api_service;

NOTIFY pgrst, 'reload schema';
```

   Que hace cada bloque:

   - La tabla lleva las seis columnas de auditoria que usan las demas tablas. `trg_set_audit_fields` las rellena con el usuario del JWT.
   - `trg_log_changes` escribe en `api.historial_cambios`. Solo las cuatro tablas operativas lo tienen; ponerlo aqui es opcional.
   - `rl_soft_delete` convierte cada `DELETE` en un `UPDATE` de `deleted_at`. Lleva `RETURNING *` porque PostgREST pide la fila borrada.
   - `GRANT` da acceso al rol `api_service`, que es el que usa PostgREST. La migracion 3 ya deja privilegios por defecto para las tablas nuevas de `api`, asi que el `GRANT` explicito es redundante, pero deja claro el permiso.
   - `NOTIFY pgrst, 'reload schema'` hace que PostgREST recargue su cache de esquema sin reiniciarse.

3. Aplicar la migracion:

```sh
npm run migrate
npm run migrate:status
```

   `migrate:status` debe responder `Database schema is up to date!`. Probado: `All migrations have been successfully applied.` y tabla, regla, triggers y funcion presentes con `\d api.inspecciones` y `pg_proc`.

4. Permitir el recurso en `src/modules/data/policy.ts`. Cada lista decide que puede hacer el gateway:

   - `RECURSOS_OPERATIVOS`: lectura y escritura para ambos roles. Es la lista para `inspecciones`. Anadir `'inspecciones'` al array.
   - `CATALOGOS`: lectura para ambos y escritura solo para administrador.
   - `HISTORIAL_CAMBIOS`: solo lectura para ambos.
   - `RPC_PERMITIDAS`: funciones que se llaman con `POST /api/data/rpc/<nombre>`. La funcion del ejemplo necesita entrar aqui: anadir `'contar_inspecciones_por_senal'`.

   Sin estos cambios, PostgREST tiene el recurso pero el gateway responde 404 o 405.

5. Reiniciar el gateway. Los permisos se leen al arrancar. En desarrollo, `npm run dev` lo hace solo al guardar.

```sh
npm run dev
```

6. Probar con un access token. Ajusta la contrasena del administrador a la de tu `.env`:

```sh
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"usuario":"admin","contrasena":"Admin12345!"}' | jq -r .accessToken)

SENAL=$(curl -s "http://localhost:8080/api/data/senales?select=id_senal&limit=1" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id_senal')

curl -s -X POST http://localhost:8080/api/data/inspecciones \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -H 'Prefer: return=representation' \
  -d "{\"id_senal\":\"$SENAL\",\"fecha\":\"2026-10-01T10:00:00\",\"observaciones\":\"Sin novedad\"}"

curl -s "http://localhost:8080/api/data/inspecciones?select=*&deleted_at=is.null" \
  -H "Authorization: Bearer $TOKEN"

curl -s -X POST http://localhost:8080/api/data/rpc/contar_inspecciones_por_senal \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{}'
```

   El `POST` devuelve la fila creada con `created_by` igual al usuario del token (`"admin"`), que es la prueba de que el trigger de auditoria corre. La funcion devuelve `[{"id_senal":"...","total":1}]`.

Reglas para migraciones:

- Una migracion aplicada no se edita nunca. Un cambio posterior va en una migracion nueva, porque las bases que ya la ejecutaron no volveran a correrla.
- Idempotente cuando se pueda: `IF NOT EXISTS`, `DROP ... IF EXISTS`, `CREATE OR REPLACE`. Asi, marcarla o reintentarla no rompe nada.
- Un cambio logico por migracion. Si falla, el error apunta a una sola cosa.
- Revisar `npm run migrate:status` antes de hacer commit.

Si una migracion falla:

1. Leer el error de Prisma y el de PostgreSQL. El gateway no arranca mientras haya una migracion pendiente fallida.
2. Mirar si quedo algo aplicado a medias (una tabla creada, una regla cambiada). Si es asi, corregir el estado a mano o dejar la migracion como aplicada con `npx prisma migrate resolve --applied <nombre>`.
3. Si no quedo nada, marcarla como revertida con `npx prisma migrate resolve --rolled-back <nombre>`, corregir el SQL y volver a ejecutar `npm run migrate`.

## 8. Docker para desarrollo y demos

Docker sirve para levantar el stack completo en una maquina de desarrollo o para una demo. No es para produccion.

```sh
docker compose up -d --build
```

- `db`: PostgreSQL 17 (`postgres:17-alpine`). Publica `${DB_HOST_PORT:-5437}` en el host.
- `api`: imagen construida desde el `Dockerfile`, con PostgREST 14.7 copiado de la imagen oficial. Publica `${API_HOST_PORT:-8080}`. PostgREST queda dentro del contenedor, en `127.0.0.1:3000`, sin publicar.

Secretos de demo. Son valores por defecto del `docker-compose.yml`. Antes de cualquier uso real hay que sobreescribirlos por entorno o en un `.env`:

- `JWT_ACCESS_SECRET` y `POSTGREST_JWT_SECRET`.
- `ADMIN_USER=admin` y `ADMIN_PASSWORD=Admin12345!`.
- La contrasena de PostgreSQL (`admin`) no se sobreescribe por entorno: esta fija en `POSTGRES_PASSWORD` y en `DATABASE_URL` dentro de `docker-compose.yml`. Cambiarla exige editar ese archivo en los dos sitios.

El compose activa `ENABLE_DOCS=true` y `CORS_ORIGIN` para `localhost:5173` y `localhost:8081`. Para apagar y borrar la base de datos: `docker compose down -v`.

## 9. Scripts y estructura

Scripts de `package.json`:

| Script | Comando | Uso |
|---|---|---|
| `npm start` | `node src/start.ts` | Migraciones, admin inicial, PostgREST y servidor. |
| `npm run dev` | `node --watch src/start.ts` | Igual que `start`, con recarga al guardar. |
| `npm run typecheck` | `tsc --noEmit` | Comprueba tipos. No genera nada. |
| `npm run migrate` | `prisma migrate deploy` | Aplica las migraciones pendientes. |
| `npm run migrate:status` | `prisma migrate status` | Muestra el estado de las migraciones. |
| `npm run migration:new -- <nombre>` | `node scripts/new-migration.ts` | Crea una carpeta de migracion con un SQL vacio. El nombre va en snake_case. |

Estructura:

```
src/
  start.ts              arranque: migraciones, admin inicial, PostgREST, servidor, purga de tokens
  app.ts                Express: middlewares y rutas
  docs.ts               Swagger UI (solo con ENABLE_DOCS)
  config/env.ts         validacion de variables de entorno
  db/pool.ts            pool de pg
  bootstrap/ensureAdmin.ts
  lib/tokens.ts         access token, refresh token y JWT interno de PostgREST
  middleware/           autenticacion, roles, CORS, cabeceras, limite de intentos, errores
  modules/auth/         login, refresh, logout, me
  modules/users/        gestion de usuarios (administrador)
  modules/data/         proxy a PostgREST y matriz de permisos (policy.ts)
prisma/
  schema.prisma         sin modelos: solo datasource
  migrations/           migraciones SQL escritas a mano
prisma.config.ts        URL de la base de datos para Prisma
scripts/new-migration.ts
docs/postgrest.md       guia de PostgREST para este proyecto
bin/                    binario de PostgREST (START_POSTGREST=true)
```

## 10. Solucion de problemas

- Migracion fallida, P3018 al arrancar: la base ya tiene objetos de una migracion no registrada (42723, "already exists") o un paso fallo. Ver la seccion 6, paso 12, o la seccion 7 para el procedimiento general.
- P3009 en el siguiente intento: una migracion quedo registrada como fallida. Revisar el estado, marcarla con `npx prisma migrate resolve --rolled-back <nombre>` o `--applied` si ya esta completa, y volver a ejecutar `npm run migrate`.
- `No se encontro PostgREST en ...`: el binario no existe en `POSTGREST_BIN`. Descargarlo (seccion 6, paso 5) o usar `START_POSTGREST=false` si PostgREST corre aparte.
- 401 al refrescar (`POST /api/auth/refresh`):
  - La cookie no llega. Revisar que la peticion vaya a `/api/auth` en el mismo sitio y que el cliente envie credenciales.
  - `COOKIE_SECURE=true` sobre HTTP: el navegador no guarda la cookie. Servir por HTTPS o poner `COOKIE_SECURE=false` solo en desarrollo local.
  - Reuso de refresh token (dos pestanas a la vez, o una sesion revocada por un cambio de contrasena o de rol): hay que volver a iniciar sesion.
- CORS: el origen no aparece en `CORS_ORIGIN`, o difiere en esquema, puerto o barra final. El gateway responde sin cabeceras CORS y el navegador bloquea la peticion.
- 429 en login: 10 fallos en 15 minutos desde la misma IP. Esperar, o revisar `TRUST_PROXY`. Sin `TRUST_PROXY=1` detras de nginx, todos los usuarios comparten la IP del proxy y se bloquean entre si.
- 502 en `/api/data`: PostgREST no responde. Revisar los logs, que llevan el prefijo `[postgrest]`. 504: PostgREST tardo mas de 30 segundos.
- 400 `Se requiere un filtro para modificar o eliminar`: un `PATCH` o `DELETE` sin filtro. Anadir un filtro, por ejemplo `?id_senal=eq.<uuid>`.
- 409 `El registro esta en uso`: un catalogo tiene registros activos que lo referencian. Dar de baja primero esos registros.
- `cannot perform DELETE RETURNING`: falta la migracion `20260101000500_soft_delete_returning` en la base. Ver la seccion 6, paso 12.
- 400 `All object keys must match` (PGRST102): en una insercion en lote, todos los objetos deben tener las mismas claves.
- La tabla nueva da 404 o no aparece: la migracion no tiene `NOTIFY pgrst, 'reload schema'`, o falta el recurso en `policy.ts`.
- `ENV <CAMPO>: <mensaje>` al arrancar y salida con codigo 1: una variable falta o no cumple la validacion. El mensaje indica cual.
- `/api/docs` responde 404: `ENABLE_DOCS` esta en `false`.
