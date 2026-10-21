# Servidor avanzado

Esta guia cubre la configuracion del gateway y de PostgREST: variables de entorno, autenticacion, permisos, produccion sin Docker, migraciones, seed, backups, scripts y solucion de problemas. Para levantar el sistema por primera vez, ver [01-arranque-rapido.md](01-arranque-rapido.md). Para el cliente, ver [03-cliente-avanzado.md](03-cliente-avanzado.md). Este documento incluye el contenido de la antigua guia `docs/postgrest.md`.

## 1. Arquitectura

```
Cliente --HTTP--> Node (gateway, :8080) --HTTP--> PostgREST (127.0.0.1:3000) --SQL--> PostgreSQL
                       |                                                              ^
                       +------- SQL directo (login, refresh, usuarios y health) -------+
```

- El gateway autentica (login, refresh, logout) contra `auth.usuarios_sistema` y emite su propio access token.
- El gateway autoriza cada peticion con la matriz de `src/modules/data/policy.ts`: recurso, metodo, rol y filtro obligatorio para `PATCH` y `DELETE`.
- Las rutas `/api/data/*` pasan por el gateway hacia PostgREST. Cada peticion lleva un JWT interno de 30 segundos (seccion 3).
- Las rutas `/api/auth/*` y `/api/users/*` hablan con PostgreSQL directamente, sin PostgREST. `/api/health` consulta la base y PostgREST.
- PostgREST escucha solo en `127.0.0.1`. El cliente nunca recibe un token de PostgREST ni conoce su direccion.
- El servidor no sirve el cliente. Cualquier ruta no declarada responde 404 en JSON.

## 2. Variables de entorno

El gateway lee `.env` desde el directorio de trabajo (copia `.env.example`) y ademas las variables del proceso. Una variable con cadena vacia cuenta como no definida. Los secretos deben tener al menos 32 caracteres. Las variables booleanas aceptan solo `true` o `false`.

| Variable | Requerida | Por defecto | Descripcion |
|---|---|---|---|
| `DATABASE_URL` | Si | - | Cadena de conexion a PostgreSQL. La usan Prisma (migraciones), el gateway y PostgREST. |
| `PORT` | No | `8080` | Puerto HTTP del gateway. El servidor escucha en todas las interfaces; no hay variable para limitarlo. |
| `NODE_ENV` | No | `development` | `development`, `production` o `test`. Con `production`, `COOKIE_SECURE` vale `true` si no se define. |
| `JWT_ACCESS_SECRET` | Si | - | Secreto HS256 que firma los access token. Minimo 32 caracteres. |
| `ACCESS_TOKEN_TTL` | No | `15m` | Vida del access token en formato de jsonwebtoken (`15m`, `1h`). |
| `REFRESH_TOKEN_TTL_DAYS` | No | `7` | Dias de vida del refresh token. Entero positivo. |
| `COOKIE_SECURE` | No | `true` en `production`, `false` en otro caso | Marca la cookie de refresh como `Secure`. Usa `true` solo con HTTPS. |
| `CORS_ORIGIN` | No | vacio (sin CORS) | Origenes permitidos, separados por comas. Cada origen incluye esquema y puerto, sin barra final. |
| `POSTGREST_URL` | No | `http://127.0.0.1:3000` | URL donde escucha PostgREST. Debe ser una URL valida. |
| `POSTGREST_JWT_SECRET` | Si | - | Secreto con el que PostgREST valida el JWT interno. Minimo 32 caracteres. Si PostgREST corre aparte, debe ser el mismo. |
| `START_POSTGREST` | No | `true` | `true`: el gateway lanza PostgREST como proceso hijo. `false`: PostgREST corre por su cuenta. |
| `POSTGREST_BIN` | No | `./bin/postgrest` | Ruta al binario de PostgREST cuando `START_POSTGREST=true`. Se resuelve desde el directorio de trabajo. |
| `ENABLE_DOCS` | No | `false` | Expone Swagger UI en `/api/docs`. Solo para desarrollo. |
| `TRUST_PROXY` | No | `0` | Numero de proxies de confianza delante del gateway. Detras de nginx, `1`. Sin esto, el limite de intentos ve la IP del proxy. |

El primer administrador se crea desde la pantalla de onboarding inicial al abrir la web. Si un administrador pierde su contrasena, se recupera con el codigo de recuperacion desde la pantalla "Olvide mi contrasena".

### Variables de Docker Compose

`docker-compose.yml` define estos valores. Las dos primeras solo las usa Compose para publicar puertos. El resto son variables del contenedor `api`, y el gateway las lee como cualquier otra variable de entorno.

| Variable | Valor en el compose | Notas |
|---|---|---|
| `DB_HOST_PORT` | `5437` (host) a `5432` (contenedor) | Solo Compose: puerto publicado de PostgreSQL. |
| `API_HOST_PORT` | `8080` | Solo Compose: puerto publicado del gateway. |
| `JWT_ACCESS_SECRET` | Valor de demo, sobreescribible | Secreto de demo. Cambialo. |
| `POSTGREST_JWT_SECRET` | Valor de demo, sobreescribible | Secreto de demo. Cambialo. |
| `CORS_ORIGIN` | `http://localhost:5173,http://localhost:8081` | Origenes de desarrollo y del cliente en Docker. |
| `TRUST_PROXY` | `1` | Sobreescribible. |
| `ENABLE_DOCS` | `true` | Swagger activo en el stack Docker. |
| `COOKIE_SECURE` | `false` fijo | No sobreescribible por entorno en el compose. |
| `NODE_ENV` | `production` fijo | Imagen de produccion, pero el compose no es de produccion. |

La contrasena de PostgreSQL (`admin`) esta fija en `POSTGRES_PASSWORD` y en `DATABASE_URL` dentro de `docker-compose.yml`. Cambiarla exige editar los dos sitios.

### Variables que el gateway pasa a PostgREST

Cuando `START_POSTGREST=true`, el gateway lanza PostgREST con un entorno minimo. No hereda `process.env` completo, para no filtrar secretos.

| Variable de PostgREST | Valor que pone el gateway |
|---|---|
| `PGRST_DB_URI` | Valor de `DATABASE_URL` |
| `PGRST_DB_SCHEMAS` | `api` (fijo) |
| `PGRST_JWT_SECRET` | Valor de `POSTGREST_JWT_SECRET` |
| `PGRST_SERVER_HOST` | Nombre de host de `POSTGREST_URL` |
| `PGRST_SERVER_PORT` | Puerto de `POSTGREST_URL` |
| `PGRST_LOG_LEVEL` | `warn` (fijo) |
| `PATH` | Heredado del proceso |

Consecuencia: no hay variable para ajustar otras opciones de PostgREST cuando el gateway lo lanza. Para ello, arrancalo aparte con `START_POSTGREST=false` y configuralo tu mismo. Como minimo, debe usar el esquema `api`, el mismo `POSTGREST_JWT_SECRET` y la misma base.

### El archivo `postgrest.conf`

El archivo `postgrest.conf` de la raiz es local. Git lo ignora (commit `chore: ignore local postgrest.conf`) y no esta en el repositorio. El gateway no lo lee: no lo pasa como argumento a PostgREST, que lo lanza con variables de entorno.

Sus valores no coinciden con el arranque del gateway. Usa el puerto 5430 (el `.env.example` usa 5432), expone los esquemas `api` y `auth` (el gateway expone solo `api`, y `auth` nunca debe exponerse) y trae un secreto de ejemplo. Sirve como referencia si arrancas PostgREST a mano, pero no lo uses tal cual.

### Discrepancias en `.env.example`

El comentario de `ENABLE_DOCS` en `.env.example` dice `/api-docs`. La ruta real es `/api/docs` (`src/docs.ts`). Pendiente de corregir el comentario.

## 3. Autenticacion

### Endpoints

| Ruta | Metodo | Acceso | Respuesta |
|---|---|---|---|
| `/api/auth/login` | `POST` | Publico, con limite de intentos | `{ "accessToken", "usuario" }` y cookie de refresh. Cuerpo: `{ "usuario", "contrasena" }`. |
| `/api/auth/refresh` | `POST` | Cookie de refresh | Access token nuevo y cookie rotada. |
| `/api/auth/logout` | `POST` | Cookie de refresh | `204`. Revoca el refresh token, borra la cookie. |
| `/api/auth/me` | `GET` | Access token | Datos del usuario de la sesion. |

Las rutas de `/api/auth` responden con `Cache-Control: no-store`. El cuerpo JSON de `/api/auth` admite hasta 100 KB.

### Access token

- JWT HS256 firmado con `JWT_ACCESS_SECRET`, con emisor `infoanav`.
- Claims: `sub`, `usuario`, `rol` (`administrador` o `usuario`).
- Vida: `ACCESS_TOKEN_TTL` (15 minutos por defecto).
- El cliente lo guarda en memoria, no en `localStorage`, y lo envia como `Authorization: Bearer <token>`.

### Refresh token

- 64 bytes aleatorios en base64url, opacos para el cliente.
- La base guarda solo su hash SHA-256 en `auth.refresh_tokens`.
- Vida: `REFRESH_TOKEN_TTL_DAYS` dias.
- Cookie: `httpOnly`, `SameSite=Strict`, `path=/api/auth`, `Secure` segun `COOKIE_SECURE`, caduca con el refresh.
- `POST /api/auth/refresh` lee la cookie, marca el token usado como reemplazado, emite otro en la misma familia y devuelve un access token nuevo. Cada uso rota el token.
- Reuso: si llega un refresh token ya usado o revocado, el gateway revoca toda la familia. Todas las sesiones derivadas de ese login quedan cerradas y hay que volver a iniciar sesion.

### Cambios que cierran sesiones

Cambiar la contrasena o el rol de un usuario, o darlo de baja, revoca sus refresh tokens.

### Limite de intentos

Hay 10 intentos fallidos de login por IP cada 15 minutos. Los exitosos no cuentan. Al superarlo responde `429`.

### Purga

Cada 6 horas se borran los refresh tokens caducados hace mas de un dia.

### JWT interno para PostgREST

Por cada peticion a `/api/data`, el gateway firma un JWT con `POSTGREST_JWT_SECRET` (`src/lib/tokens.ts`):

```json
{ "role": "api_service", "usuario": "admin", "iat": 1760000000, "exp": 1760000030 }
```

- Algoritmo HS256. Caduca a los 30 segundos y sirve solo para la peticion que lo genera.
- `role` indica a PostgREST que ejecute como el rol de base de datos `api_service`.
- `usuario` lo toma el gateway del access token ya verificado, nunca del cliente.

PostgREST copia el payload en la variable de sesion `request.jwt.claims`. Los triggers la leen:

- `api.set_audit_fields()` rellena `created_by` y `updated_by` en `INSERT` y `UPDATE`, y `deleted_by` cuando un registro pasa a baja. Sin usuario en el token, usa `sistema`.
- `api.log_changes()` escribe en `api.historial_cambios` el usuario, la operacion y los valores antes y despues. Lo usan `senales`, `fallas`, `mantenimientos` y `equipamientos_senal`.

Por eso el campo `usuario` importa: si cambia, cambian los datos de auditoria.

### Limitaciones conocidas

- Dos pestanas que refrescan a la vez con la misma cookie cierran la sesion. La segunda llega con un token ya usado y el gateway lo trata como reuso. No hay periodo de gracia.
- Un access token ya emitido sigue valido hasta 15 minutos despues de una baja o de un cambio de rol. El rol viaja dentro del token y el gateway no consulta la base en cada peticion a `/api/data`.
- Las listas con `Prefer: count=exact` responden `206 Partial Content` cuando la pagina no cubre todo el resultado. Sin `count=exact`, el total aparece como `*` y la respuesta es `200`. El cliente debe tratar `200` y `206` como exito.

## 4. Permisos

### Orden de evaluacion

El gateway revisa cada peticion a `/api/data` en este orden antes de reenviarla:

1. Recurso fuera de la matriz: `404`.
2. Metodo no permitido para la clase del recurso (por ejemplo `GET` sobre `rpc`, o cualquier `PUT`): `405`.
3. `PATCH` o `DELETE` sin filtro: `400`. Los parametros `select`, `order`, `limit`, `offset`, `columns` y `on_conflict` no cuentan como filtro.
4. Escritura sin permiso para el rol: `403`.
5. Reglas por cuerpo (abajo) y reenvio a PostgREST.

El cuerpo admite hasta 5 MB. Si supera el limite responde `413`. Si PostgREST no responde, `502`. Si tarda mas de 30 segundos, `504`.

### Recursos por clase (`src/modules/data/policy.ts`)

| Clase | Recursos | Lectura (`GET`, `HEAD`) | Escritura |
|---|---|---|---|
| Operativo | `senales`, `fallas`, `mantenimientos`, `equipamientos_senal`, `plan_mantenimiento`, `lmf`, `racon`, `hechos`, `equipos`, `equipo_ubicaciones`, `plantas`, `plantas_fallas`, `buques`, `buque_maquinas`, `buque_plantas`, `alistamiento_buques`, `personal`, `libros`, `prestamos`, `pronosticos_senal` | Ambos roles | `POST`, `PATCH`, `DELETE`: ambos roles, con las reglas de abajo |
| Catalogo | `caracteristicas`, `categorias`, `colores`, `colores_luz`, `complejidades`, `empresas`, `energias`, `estaciones`, `estados`, `estados_senal`, `formas`, `idiomas`, `marcas_tope`, `mares`, `materiales`, `misiones_buque`, `modelos_equipo`, `modelos_senal`, `origenes_falla`, `tipos_alistamiento`, `tipos_documento`, `tipos_equipamiento`, `tipos_falla`, `tipos_mantenimiento`, `tipos_senal`, `ubicaciones_medio`, `usuarios_navegacion`, `zonas` | Ambos roles | Solo administrador |
| Catalogo abierto | `temas`, `paises`, `editoriales` | Ambos roles | `POST`: ambos roles. `PATCH` y `DELETE`: solo administrador |
| Historial | `historial_cambios` | Ambos roles | Nadie (`403`) |
| Vistas | `v_equipos`, `v_alistamiento_buques`, `v_libros`, `v_senales_estadisticas` | Ambos roles | Nadie (`403`) |
| RPC | `rpc/get_dashboard_stats`, `rpc/get_fault_analytics`, `rpc/get_status_by_zone` | Solo `POST` | Ambos roles |

Las funciones RPC se llaman con `POST /api/data/rpc/<nombre>`. Una funcion fuera de `RPC_PERMITIDAS` responde `404`.

### Reglas por cuerpo

Se inspeccionan los cuerpos de `POST` y `PATCH` sobre `senales` y `personal`. El gateway lee el cuerpo completo (limite de 5 MB, timeout de 30 segundos), lo parsea como JSON (si no es JSON valido responde `400` `Cuerpo invalido`) y lo evalua antes de reenviarlo. Acepta un objeto o un arreglo de objetos.

Para el rol `usuario` responden `403`:

- `personal`, `PATCH` con `fecha_baja: null` (reactivar). Dar de baja (`fecha_baja` con valor) sigue permitido.
- `senales`, `PATCH` con `fecha_retirada: null` (reactivar una baja). Dar de baja sigue permitido.
- `senales`, `PATCH` con la clave `deleted_at` presente, con valor o con `null`. Eliminar y restaurar son solo del administrador.

Otras reglas:

- `DELETE` sobre `senales`: solo administrador.
- `POST` de upsert sobre `senales` o `personal` (cabecera `Prefer` con `resolution=`, o query `on_conflict`): solo administrador. El alta `POST` sin esas marcas sigue permitida a ambos roles.

El administrador no tiene restricciones por cuerpo. El cliente elimina las senales con `PATCH {deleted_at: <fecha>}`, asi que esa operacion la hace solo el administrador.

### Roles

- `administrador`: todo lo anterior, mas la gestion de usuarios.
- `usuario`: lectura de todo, escritura en recursos operativos (con las reglas anteriores), RPC y alta (`POST`) en los catalogos abiertos. No modifica ni da de baja catalogos, ni escribe historial.

### Gestion de usuarios

Solo administrador. Todas las rutas van bajo `/api/users`.

| Ruta | Notas |
|---|---|
| `GET /api/users` | Lista usuarios. `?incluir_bajas=true` incluye las bajas. |
| `POST /api/users` | Crea usuario. |
| `PATCH /api/users/:id` | Modifica usuario. |
| `DELETE /api/users/:id` | Baja logica. |

Validaciones:

- Usuario: de 3 a 50 caracteres, solo letras, numeros, `.`, `_` y `-`.
- Contrasena: de 8 a 72 caracteres.
- Cargo: hasta 100 caracteres, opcional.

Pendiente de confirmar: la contrasena se valida por caracteres (zod) y bcrypt solo usa los primeros 72 bytes UTF-8. Para contrasenas con caracteres no ASCII, 72 caracteres pueden superar los 72 bytes.

### Rutas generales

| Ruta | Acceso | Notas |
|---|---|---|
| `/api/auth` | Login publico. `me` pide token. | `login`, `refresh`, `logout`, `me`. |
| `/api/users` | Solo administrador. | Ver la tabla anterior. |
| `/api/data` | Token valido. | Proxy hacia PostgREST con la matriz anterior. |
| `/api/health` | Publico. | `200` si la base y PostgREST contestan, `503` si no. Devuelve `{ status, db, postgrest }`. |
| `/api/docs` | Solo con `ENABLE_DOCS=true`. | Swagger UI sobre la especificacion de PostgREST. Solo desarrollo. |

## 5. PostgREST: consultas y uso

Esta seccion reune el contenido de la antigua guia `docs/postgrest.md`. Los ejemplos usan una variable de base y un token obtenido con login. Cambia la contrasena de ejemplo por la de tu `.env`.

```sh
B=http://localhost:8080
TOKEN=$(curl -s -X POST $B/api/auth/login -H 'Content-Type: application/json' \
  -d '{"usuario":"<tu usuario>","contrasena":"<tu contrasena>"}' | jq -r .accessToken)
```

### Esquema expuesto

El gateway arranca PostgREST con `PGRST_DB_SCHEMAS=api`. Solo las tablas, vistas y funciones de `api` son accesibles. El esquema `auth` (usuarios, refresh tokens) nunca se expone.

Las migraciones quitan RLS de las tablas de `api` y dan al rol `api_service` `ALL` sobre tablas y secuencias. La autorizacion la decide el gateway, no la base de datos. Por eso el puerto de PostgREST no debe publicarse nunca.

### Seleccionar, ordenar y filtrar

```sh
curl -s "$B/api/data/senales?select=codigo_lsm,nombre&order=codigo_lsm.desc&limit=2" \
  -H "Authorization: Bearer $TOKEN"
```

`order` admite `campo.asc` y `campo.desc`, separados por comas para varios campos. Respuesta de ejemplo (recortada): `[{"codigo_lsm":"S-003","nombre":"Paso Gamma"},{"codigo_lsm":"S-002","nombre":"Cruce Beta"}]`.

El filtro va en la query como `columna=operador.valor`:

```sh
# igualdad
curl -s "$B/api/data/senales?codigo_lsm=eq.S-001&select=codigo_lsm" -H "Authorization: Bearer $TOKEN"
# distinto
curl -s "$B/api/data/senales?nombre=neq.Paso%20Gamma&select=nombre" -H "Authorization: Bearer $TOKEN"
# rango con dos condiciones sobre la misma columna
curl -s "$B/api/data/senales?fecha_instalacion=gt.2021-01-01&fecha_instalacion=lte.2022-12-31&select=codigo_lsm" -H "Authorization: Bearer $TOKEN"
# busqueda sin distinguir mayusculas (* es comodin)
curl -s "$B/api/data/senales?nombre=ilike.*cruce*&select=nombre" -H "Authorization: Bearer $TOKEN"
# lista de valores
curl -s "$B/api/data/senales?codigo_lsm=in.(S-001,S-003)&select=codigo_lsm" -H "Authorization: Bearer $TOKEN"
# nulos
curl -s "$B/api/data/senales?id_zona=is.null&select=codigo_lsm" -H "Authorization: Bearer $TOKEN"
curl -s "$B/api/data/senales?fecha_instalacion=not.is.null&select=codigo_lsm" -H "Authorization: Bearer $TOKEN"
```

Operadores: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`, `in`, `is` (con `null`), y la negacion con `not.` delante.

Para una condicion OR se usa `or=(...)`. Las comillas de la URL son obligatorias para que el shell no interprete los parentesis:

```sh
curl -s "$B/api/data/senales?or=(codigo_lsm.eq.S-001,codigo_lsm.eq.S-003)&select=codigo_lsm" \
  -H "Authorization: Bearer $TOKEN"
```

### Paginacion y Content-Range

`limit` y `offset` cortan la pagina. Para conocer el total, se pide `Prefer: count=exact`:

```sh
curl -s -D - "$B/api/data/senales?select=codigo_lsm&order=codigo_lsm.asc&limit=2&offset=1" \
  -H "Authorization: Bearer $TOKEN" -H "Prefer: count=exact"
```

Cabecera relevante: `content-range: 1-2/3`, con la forma `desde-hasta/total`. Con `count=exact`, si la pagina no cubre todo el resultado el estado es `206`; si lo cubre, `200`. Sin `count=exact`, el total aparece como `*` (por ejemplo `content-range: 0-1/*`) con estado `200`.

La cabecera `Range` tambien pagina: `-H "Range: 0-0" -H "Range-Unit: items"` devuelve una sola fila con `content-range: 0-0/*`.

### Embebidos

Si hay clave foranea, el recurso relacionado se incluye con su nombre de tabla:

```sh
curl -s "$B/api/data/fallas?select=causa_de_falla,senales(codigo_lsm,nombre)" \
  -H "Authorization: Bearer $TOKEN"
```

### Bajas logicas

Las bajas son logicas. El gateway no filtra `deleted_at` por su cuenta, asi que un `GET` sin filtro devuelve tambien las filas dadas de baja. Para ver solo las activas:

```sh
curl -s "$B/api/data/senales?select=codigo_lsm,deleted_at&deleted_at=is.null" -H "Authorization: Bearer $TOKEN"
```

### Insercion

Una fila, con la representacion en la respuesta:

```sh
curl -s -X POST "$B/api/data/zonas" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -H 'Prefer: return=representation' \
  -d '{"nombre":"Norte"}'
```

`Prefer: return=representation` devuelve la fila creada (`201`). Sin esa cabecera, la respuesta es `201` con cuerpo vacio.

En lote se envia un arreglo. Todos los objetos deben tener exactamente las mismas claves. Si no coinciden, PostgREST responde `400` con `PGRST102` (`All object keys must match`). Un UUID invalido responde `400` con `22P02`.

### PATCH y DELETE

`PATCH` y `DELETE` exigen un filtro. Sin filtro, el gateway responde `400` antes de llegar a PostgREST:

```sh
curl -s -X PATCH "$B/api/data/senales" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"nombre":"x"}'
# {"error":"Se requiere un filtro para modificar o eliminar"}
```

Con filtro, solo se actualizan las filas que cumplen la condicion:

```sh
curl -s -X PATCH "$B/api/data/senales?codigo_lsm=eq.S-003" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -H 'Prefer: return=representation' -d '{"nombre":"Paso Gamma 2"}'
```

`DELETE` no borra fisicamente. Cada tabla con `deleted_at` tiene una regla `rl_soft_delete` que convierte el `DELETE` en un `UPDATE` de `deleted_at`. La regla lleva `RETURNING *`, por eso la respuesta trae la fila con `deleted_at` relleno:

```sh
curl -s -X DELETE "$B/api/data/senales?codigo_lsm=eq.S-002" \
  -H "Authorization: Bearer $TOKEN" -H 'Prefer: return=representation'
```

La migracion `20260101000500_soft_delete_returning` anadio `RETURNING *` a las reglas. Sin ella, cada `DELETE` falla con `cannot perform DELETE RETURNING`. La migracion `20261016173527_recrear_reglas_soft_delete` recrea las reglas con el bloque `DO` que `AGENTS.md` pide repetir en cada migracion que anada columnas.

### RPC

Las funciones se llaman con `POST /api/data/rpc/<nombre>` y el cuerpo son sus argumentos en JSON. Solo se permiten las de `RPC_PERMITIDAS` en `policy.ts`: `get_dashboard_stats`, `get_fault_analytics` y `get_status_by_zone`.

```sh
curl -s -X POST "$B/api/data/rpc/get_fault_analytics" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"p_mes":9,"p_anio":2026}'

curl -s -X POST "$B/api/data/rpc/get_status_by_zone" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{}'
```

Una funcion fuera de la lista responde `404`. Llamarla con `GET` responde `405` (`{"error":"Metodo no permitido"}`).

### Errores

Hay dos formas de error.

Errores del gateway (`policy.ts` y el proxy), con la forma `{ "error": "..." }`:

- `401` `No autenticado`: falta el token o no se puede verificar.
- `403` `Sin permisos`: el rol no puede escribir ese recurso.
- `404` `No encontrado`: recurso fuera de la matriz.
- `405` `Metodo no permitido`.
- `400` `Se requiere un filtro para modificar o eliminar`.
- `413` `Cuerpo demasiado grande`.

Errores de PostgREST, con la forma `{ code, message, details, hint }`:

```json
{"code":"22P02","details":null,"hint":null,"message":"invalid input syntax for type uuid: \"x\""}
```

La guarda de catalogos responde `409` cuando se intenta dar de baja un registro que aun tiene registros activos que lo referencian. La funcion `api.prevent_delete_if_referenced()` lanza `SQLSTATE 23503`, y PostgREST lo traduce a `409`:

```json
{"code":"23503","details":null,"hint":"Referenciado desde api.senales","message":"El registro esta en uso"}
```

Antes de dar de baja un catalogo, hay que dar de baja o cambiar los registros que lo usan.

### Recarga del esquema

PostgREST guarda en cache la estructura de `api`. Despues de crear o cambiar objetos hay que avisarle. Las migraciones lo hacen con:

```sql
NOTIFY pgrst, 'reload schema';
```

Si una tabla nueva responde 404 o no aparece en la especificacion, falta ese `NOTIFY` o la migracion no se ejecuto.

### Por que RLS esta desactivado

La migracion `20260101000200_api_service_access` desactiva RLS en todas las tablas de `api` y borra sus politicas. El rol `api_service` tiene `ALL` sobre esas tablas, y el unico JWT que lo activa lo firma el gateway. La base no recibe JWT de usuarios finales, asi que no hay politicas por usuario que evaluar.

La autorizacion esta en tres sitios:

1. `policy.ts`: que recurso, metodo y rol estan permitidos. Es el primer filtro.
2. El filtro obligatorio para `PATCH` y `DELETE`.
3. Las reglas y guardas de la base: baja logica y guarda de catalogos.

No anadas RLS, roles de PostgreSQL ni JWT nuevos sin revisar este apartado.

### Depuracion

- Swagger UI: con `ENABLE_DOCS=true`, `GET /api/docs` muestra la especificacion de PostgREST con el esquema `bearerAuth`. La especificacion se pide a `/api/docs/openapi.json` y se guarda en cache 60 segundos. Solo para desarrollo.
- Logs: las lineas de PostgREST aparecen en la salida del gateway con el prefijo `[postgrest]`. Cada consulta a `/api/health`, incluida la del `HEALTHCHECK` de la imagen, genera un `GET /` con `401` en ese log, porque el gateway sondea la raiz de PostgREST.
- Salud: `GET /api/health` responde `{ "status": "ok", "db": true, "postgrest": true }` cuando PostgREST y la base contestan.
- Prueba directa: para aislar un problema, puedes firmar a mano un JWT con `role: api_service` y el secreto `POSTGREST_JWT_SECRET`, y hacer la peticion contra PostgREST. Solo en desarrollo, nunca contra produccion.
- Si un recurso nuevo da `404` en el gateway, revisa `policy.ts`. Si da `404` o error de columna desde PostgREST, revisa la migracion y el `NOTIFY`.

## 6. Produccion sin Docker

Docker no se usa en produccion. Los pasos asumen un servidor Linux con systemd y nginx.

1. Instala Node.js 24 y comprueba la version con `node -v`, que debe mostrar `v24.x`.

2. Instala PostgreSQL 17 con los paquetes de la distribucion o el repositorio oficial. Crea el rol `api_service` antes de la primera migracion. La primera migracion lo crea si no existe, pero para eso la cuenta de la base necesita `CREATEROLE`:

```sh
sudo -u postgres psql -c "CREATE ROLE api_service NOLOGIN;"
sudo -u postgres psql -c "CREATE ROLE infoanav LOGIN PASSWORD 'cambia-esta-clave';"
sudo -u postgres psql -c "CREATE DATABASE infoanav OWNER infoanav;"
sudo -u postgres psql -c "GRANT api_service TO infoanav WITH ADMIN OPTION;"
```

   Con `CREATEROLE` en la cuenta, la primera migracion puede crear `api_service` por si sola. Esa variante no se probo de punta a punta con PostgreSQL 17.

3. Copia el proyecto (por ejemplo a `/opt/infoanav-server`) e instala solo dependencias de produccion:

```sh
cd /opt/infoanav-server
npm ci --omit=dev
```

4. Descarga PostgREST v14.x. El archivo para Linux x86-64 contiene solo el binario `postgrest`:

```sh
mkdir -p bin
curl -L -o bin/postgrest.tar.xz https://github.com/PostgREST/postgrest/releases/download/v14.7/postgrest-v14.7-linux-static-x86-64.tar.xz
tar -xJf bin/postgrest.tar.xz -C bin
rm bin/postgrest.tar.xz
chmod 0755 bin/postgrest
bin/postgrest --version
```

5. Prepara `.env` con secretos largos y propios:

```sh
cp .env.example .env
openssl rand -hex 32   # valor para JWT_ACCESS_SECRET
openssl rand -hex 32   # valor para POSTGREST_JWT_SECRET
```

   Valores a ajustar:

```
DATABASE_URL=postgresql://infoanav:cambia-esta-clave@127.0.0.1:5432/infoanav
NODE_ENV=production
COOKIE_SECURE=true
TRUST_PROXY=1
ENABLE_DOCS=false
CORS_ORIGIN=
```

   El primer administrador se crea desde la pantalla de onboarding inicial al abrir la web. Si un administrador pierde su contrasena, se recupera con el codigo de recuperacion desde la pantalla "Olvide mi contrasena".

6. Arranca con `npm start`. El comando aplica las migraciones, lanza PostgREST y empieza a escuchar en `PORT`. Si una migracion falla, el servidor no arranca. Comprueba:

```sh
curl -s http://127.0.0.1:8080/api/health
```

   El gateway escucha en todas las interfaces y no hay variable para limitarlo. Con un firewall, deja el puerto 8080 accesible solo desde nginx.

7. Unidad de systemd de ejemplo (`/etc/systemd/system/infoanav.service`). Ajusta la ruta de node con `command -v node`:

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

   `WorkingDirectory` importa: el gateway lee `.env` y resuelve `POSTGREST_BIN` desde ese directorio. Activa el servicio con `sudo systemctl enable --now infoanav`. Al recibir SIGTERM, el gateway cierra el servidor HTTP, apaga PostgREST y cierra el pool. Si no termina en 10 segundos, sale forzado.

8. Bloque de nginx de ejemplo con HTTPS. Sirve el build del cliente en `/` y envia `/api` al gateway:

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

   Con este esquema, el cliente llama a `/api` en el mismo dominio y no necesita CORS. `COOKIE_SECURE=true` exige HTTPS en el navegador. `TRUST_PROXY=1` hace que el limite de intentos use la IP real.

9. Respaldo y restauracion. Usa `pg_dump` de la misma version mayor que el servidor (17):

```sh
pg_dump --format=custom --file=/var/backups/infoanav-$(date +%F).dump "postgresql://infoanav:cambia-esta-clave@127.0.0.1:5432/infoanav"
pg_restore --dbname="postgresql://infoanav:cambia-esta-clave@127.0.0.1:5432/infoanav_nueva" /var/backups/infoanav-2026-10-16.dump
```

   La restauracion va sobre una base vacia creada con `CREATE DATABASE infoanav_nueva OWNER infoanav;`. Despues, comprueba con `npm run migrate:status`. El flujo de restauracion no se ha probado de punta a punta en este proyecto.

### Dominios separados

Si el cliente vive en `app.example.com` y la API en `api.example.com`:

- Antes del build del cliente, define `VITE_API_URL=https://api.example.com/api`. Es absoluta y Vite la incrusta en el build, asi que cambiarla exige recompilar.
- En el `.env` del gateway, `CORS_ORIGIN=https://app.example.com`.
- El cliente envia las peticiones con credenciales, porque la cookie de refresh viaja con ellas.
- Los dos subdominios tienen que ser del mismo sitio. La cookie es `SameSite=Strict`, asi que permite subdominios del mismo sitio, pero con dominios de sitios distintos el navegador no la envia y el refresh falla. Ese caso no esta soportado.

### CORS

- Con `CORS_ORIGIN` vacio, el gateway no envia cabeceras CORS.
- Una peticion sin cabecera `Origin` (curl o mismo origen) siempre se permite.
- Un origen en la lista recibe `Access-Control-Allow-Origin` con credenciales. Un origen ajeno recibe la respuesta sin cabeceras CORS, y el navegador la bloquea.
- Metodos: `GET`, `POST`, `PATCH`, `PUT`, `DELETE`, `OPTIONS`. Cabeceras permitidas: `Content-Type`, `Authorization`, `Prefer`, `Range`, `Range-Unit`, `Accept-Profile`, `Content-Profile`. Cabecera expuesta: `Content-Range`. Caducidad de la respuesta de preflight: 600 segundos.

### Proxies y cabeceras de seguridad

- `TRUST_PROXY` indica cuantos proxies hay delante. Con nginx, `1`. Sin ello, el limite de intentos ve la IP del proxy y todos los usuarios se bloquean entre si.
- Helmet activa las cabeceras por defecto. Con `ENABLE_DOCS=true` desactiva la politica CSP, porque Swagger UI usa scripts en linea.
- La cabecera `X-Powered-By` se desactiva.

## 7. Migraciones Prisma

El modelo de datos esta en `prisma/schema.prisma`: los modelos de las tablas de `api` y `auth`, con `multiSchema`. El bloque `generator` es minimo y solo habilita `partialIndexes`; no se usa `@prisma/client` ni `prisma generate`. PostgREST sigue funcionando porque solo necesita el esquema y las funciones, vistas, grants y reglas en la base, y eso va como SQL dentro de las migraciones. Las migraciones estan en `prisma/migrations/<timestamp>_<nombre>/migration.sql`. Prisma genera el SQL de las tablas a partir del schema. Lo que no modela (funciones, triggers, vistas, grants, reglas, check constraints, columnas `interval` como `Unsupported` e indices unicos por expresion como `lower(...)`) se escribe a mano en la misma migracion. Las 14 migraciones existentes son el historial y no se editan. La URL viene de `prisma.config.ts` (`DATABASE_URL`).

Scripts:

```sh
npm run migrate:create -- --name nombre_snake  # prisma migrate dev --create-only: genera la migracion sin aplicarla
npm run migrate:dev                   # prisma migrate dev: aplica en desarrollo (base sombra; puede pedir reset)
npm run migrate                       # prisma migrate deploy: aplica en produccion
npm run migrate:status                # estado; debe responder "Database schema is up to date!"
npm run migration:new -- nombre_snake # crea la carpeta con un SQL vacio, para cambios que no tocan tablas
npm run schema:validate               # prisma validate
npm run schema:format                 # prisma format
```

Migraciones del repositorio, en orden:

- `20260101000000_baseline`
- `20260101000100_auth_refresh_tokens`
- `20260101000200_api_service_access`
- `20260101000300_audit_history`
- `20260101000400_catalog_guards_indexes`
- `20260101000500_soft_delete_returning`
- `20261016171156_mantenimiento_plan_lmf_racon_hechos`
- `20261016171202_senales_opcionales_bajas_equipamiento`
- `20261016171204_catalogos_nuevos`
- `20261016173527_recrear_reglas_soft_delete`
- `20261016175118_documentacion_libros_prestamos`
- `20261016175137_flota_personal`
- `20261016175142_equipamiento_plantas`
- `20261016180651_ola4_pronostico_estadisticas`

### Reglas

- Un cambio de tabla empieza en `prisma/schema.prisma`. No escribir `CREATE TABLE` a mano para una tabla que ya esta en el schema.
- Una migracion aplicada no se edita nunca. Un cambio posterior va en una migracion nueva.
- Idempotente cuando se pueda: `IF NOT EXISTS`, `DROP ... IF EXISTS`, `CREATE OR REPLACE`.
- Un cambio logico por migracion.
- `migrate:dev` solo en desarrollo. Nunca contra produccion, donde se usa `npm run migrate`.
- Todo cambio en `api` termina con `NOTIFY pgrst, 'reload schema';`.
- Una tabla operativa nueva lleva columnas de auditoria (`created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by`), el trigger `trg_set_audit_fields` y la regla `rl_soft_delete` con `RETURNING *`.
- Una migracion que anada columnas a una tabla con `rl_soft_delete` recrea la regla al final, con el mismo bloque `DO` que `20261016173527_recrear_reglas_soft_delete`. Si no, el `DELETE` falla por una lista de columnas desactualizada.
- Revisa `npm run migrate:status` antes de hacer commit.

### Anadir un recurso nuevo

El ejemplo completo (tabla `api.inspecciones` y funcion de conteo) esta en la seccion 7 del `README.md` de la raiz. Los pasos son:

1. Agregar el modelo a `prisma/schema.prisma` y generar la migracion con `npm run migrate:create -- --name <nombre>`. Completar a mano en esa migracion los triggers, la regla de baja logica, los `GRANT` y el `NOTIFY`.
2. Aplicarla con `npm run migrate:dev` (desarrollo) o `npm run migrate` (produccion) y comprobarla con `npm run migrate:status`.
3. Permitir el recurso en `src/modules/data/policy.ts`. Elige la lista segun quien puede escribir: `RECURSOS_OPERATIVOS` (lectura y escritura para ambos roles), `CATALOGOS` (escritura solo administrador), `CATALOGOS_ABIERTOS` (alta para ambos), `HISTORIAL_CAMBIOS` o `VISTAS` (solo lectura). Las funciones RPC van en `RPC_PERMITIDAS`.
4. Reiniciar el gateway. Los permisos se leen al arrancar. Con `npm run dev` se recarga solo al guardar.

Sin el paso 3, PostgREST tiene el recurso pero el gateway responde `404` o `405`.

### Base existente y migraciones previas

Una base que ya tiene las tablas (por ejemplo, restaurada de un dump anterior a las migraciones) hace fallar `migrate deploy` con `P3018` y el codigo `42723` (objeto ya existente). Para esas bases:

1. Marcar como aplicadas las migraciones cuyo efecto ya existe. Prisma las registra sin ejecutarlas:

```sh
npx prisma migrate resolve --applied 20260101000000_baseline
npx prisma migrate resolve --applied 20260101000100_auth_refresh_tokens
npx prisma migrate resolve --applied 20260101000200_api_service_access
npx prisma migrate resolve --applied 20260101000300_audit_history
npx prisma migrate resolve --applied 20260101000400_catalog_guards_indexes
```

2. La sexta, `20260101000500_soft_delete_returning`, cambia la regla `rl_soft_delete` de todas las tablas de `api` para anadir `RETURNING *`. No la marques como aplicada a ciegas. Comprueba si hace falta:

```sh
psql "$DATABASE_URL" -Atc "SELECT tablename FROM pg_rules WHERE schemaname = 'api' AND rulename = 'rl_soft_delete' AND definition NOT LIKE '%RETURNING%';"
```

   Si la consulta devuelve filas, deja que `npm run migrate` la aplique. Es idempotente.

3. Ejecutar `npm run migrate` y luego `npm run migrate:status`.

Pendiente de confirmar: este procedimiento solo cubre las seis primeras migraciones. Las ocho siguientes (de `20261016171156` a `20261016180651`) no aparecen en la guia original. No se sabe si una base restaurada de un dump anterior necesita marcarlas o si basta con que se apliquen.

### Migracion fallida

Si una migracion queda en estado fallido, el siguiente intento responde `P3009` y el gateway no arranca.

1. Lee el error de Prisma y el de PostgreSQL.
2. Mira si quedo algo aplicado a medias (una tabla creada, una regla cambiada). Si es asi, corrige el estado a mano o marca la migracion como aplicada con `npx prisma migrate resolve --applied <nombre>`.
3. Si no quedo nada, marcala como revertida con `npx prisma migrate resolve --rolled-back <nombre>`, corrige el SQL y vuelve a ejecutar `npm run migrate`.

## 8. Seed

```sh
npm run seed
```

`scripts/seed.ts` lee el `.env`, abre una conexion con `DATABASE_URL` y ejecuta, en este orden, `prisma/seed/catalogos.sql` y `prisma/seed/equipos.sql`. Si un archivo no existe, lo omite.

- Cada archivo se ejecuta dentro de una transaccion. Si falla, hace `ROLLBACK`.
- Antes y despues cuenta las filas de cada tabla que el archivo toca y muestra una tabla con las insertadas y el total.
- Ambos archivos declaran en su cabecera que son idempotentes: insertan solo los nombres que no existen activos, sin distinguir mayusculas.
- `equipos.sql` solo siembra modelos de equipo. No migra equipos con numero de inventario, senales ni datos de personas.

Requisito: las migraciones deben estar aplicadas, porque el seed escribe en las tablas de `api`.

## 9. Scripts

| Script | Comando | Uso |
|---|---|---|
| `npm start` | `node src/start.ts` | Migraciones, PostgREST y servidor. |
| `npm run dev` | `node --watch src/start.ts` | Igual que `start`, con recarga al guardar. |
| `npm run typecheck` | `tsc --noEmit` | Comprueba tipos. No genera nada. |
| `npm run migrate:create -- --name <nombre>` | `prisma migrate dev --create-only` | Genera la migracion desde `prisma/schema.prisma` sin aplicarla. |
| `npm run migrate:dev` | `prisma migrate dev` | Aplica las pendientes en desarrollo. Usa base sombra y puede pedir reset. Nunca en produccion. |
| `npm run migrate` | `prisma migrate deploy` | Aplica las migraciones pendientes (produccion). |
| `npm run migrate:status` | `prisma migrate status` | Muestra el estado de las migraciones. |
| `npm run migration:new -- <nombre>` | `node scripts/new-migration.ts` | Crea una carpeta de migracion con un SQL vacio. El nombre va en snake_case. |
| `npm run schema:validate` | `prisma validate` | Valida `prisma/schema.prisma`. |
| `npm run schema:format` | `prisma format` | Formatea `prisma/schema.prisma`. |
| `npm run seed` | `node scripts/seed.ts` | Carga catalogos y modelos de equipo. |

Estructura de `src/`:

```
src/
  start.ts              arranque: migraciones, PostgREST, servidor, purga de tokens, apagado
  app.ts                Express: middlewares, health y rutas
  docs.ts               Swagger UI (solo con ENABLE_DOCS)
  config/env.ts         validacion de variables de entorno
  db/pool.ts            pool de pg (max 10 conexiones)
  lib/tokens.ts         access token, refresh token y JWT interno de PostgREST
  middleware/           autenticacion, roles, CORS, cabeceras, limite de intentos, errores
  modules/auth/         login, refresh, logout, me
  modules/users/        gestion de usuarios (administrador)
  modules/data/         proxy a PostgREST y matriz de permisos (policy.ts)
```

Reglas de codigo del proyecto (AGENTS.md): TypeScript sin paso de compilacion, imports con extension `.ts`, sin `enum`, `namespace`, parameter properties ni `any`.

## 10. Backups

Ver el paso 9 de la produccion sin Docker. No hay backups automaticos en el repositorio. La carpeta `backups/` existe vacia y el `.dockerignore` la excluye de la imagen.

## 11. Solucion de problemas

- Migracion fallida, `P3018` al arrancar: la base ya tiene objetos de una migracion no registrada (`42723`, "already exists") o un paso fallo. Ver la seccion de base existente.
- `P3009` en el siguiente intento: una migracion quedo registrada como fallida. Ver la seccion de migracion fallida.
- `No se encontro PostgREST en ...`: el binario no existe en `POSTGREST_BIN`. Descargalo o usa `START_POSTGREST=false` si PostgREST corre aparte.
- `El puerto de ... ya esta en uso por otro programa`: el puerto de `POSTGREST_URL` esta ocupado. Libera el puerto o cambia la URL.
- `PostgREST termino inesperadamente`: el gateway se cierra. Revisa las lineas `[postgrest]` anteriores.
- `401` al refrescar (`POST /api/auth/refresh`):
  - La cookie no llega. Revisa que la peticion vaya a `/api/auth` en el mismo sitio y que el cliente envie credenciales.
  - `COOKIE_SECURE=true` sobre HTTP: el navegador no guarda la cookie. Sirve por HTTPS, o pon `COOKIE_SECURE=false` solo en desarrollo local.
  - Reuso de refresh token (dos pestanas a la vez, o una sesion revocada por cambio de contrasena o de rol): hay que volver a iniciar sesion.
- `429` en login: 10 fallos en 15 minutos desde la misma IP. Espera, o revisa `TRUST_PROXY`.
- CORS: el origen no aparece en `CORS_ORIGIN`, o difiere en esquema, puerto o barra final.
- `502` en `/api/data`: PostgREST no responde. Revisa las lineas `[postgrest]`. `504`: PostgREST tardo mas de 30 segundos.
- `400` `Se requiere un filtro para modificar o eliminar`: un `PATCH` o `DELETE` sin filtro. Anade un filtro, por ejemplo `?id_senal=eq.<uuid>`.
- `409` `El registro esta en uso`: un catalogo tiene registros activos que lo referencian. Da de baja antes esos registros.
- `cannot perform DELETE RETURNING`: falta la migracion `20260101000500_soft_delete_returning`.
- `400` `All object keys must match` (`PGRST102`): en una insercion en lote, todos los objetos deben tener las mismas claves.
- La tabla nueva da `404` o no aparece: falta el `NOTIFY pgrst, 'reload schema'` o falta el recurso en `policy.ts`.
- `ENV <CAMPO>: <mensaje>` al arrancar y salida con codigo 1: una variable falta o no cumple la validacion.
- `/api/docs` responde `404`: `ENABLE_DOCS` esta en `false`.
- `413` `Cuerpo demasiado grande`: el cuerpo supera 5 MB. Si pasa por nginx, revisa tambien `client_max_body_size`.

## 12. Pendientes de confirmar

- Version minima de Docker Compose para el elemento `include`.
- Forma de cargar los catalogos en el stack Docker: la imagen no copia `scripts/`, asi que `npm run seed` no esta disponible en el contenedor.
- Procedimiento de base existente para las migraciones posteriores a `20260101000500`.
- Limite de contrasena: caracteres en `POST /api/users` y en `POST /api/auth/setup`. bcrypt usa 72 bytes.
- Comentario de `ENABLE_DOCS` en `.env.example` (`/api-docs`, la ruta real es `/api/docs`).
- Restauracion desde `pg_dump` y procedimiento de produccion: no probados de punta a punta.
- Uso de `postgrest.conf` como referencia: no hay un procedimiento verificado para arrancar PostgREST a mano con ese archivo.
