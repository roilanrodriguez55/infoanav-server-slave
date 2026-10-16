# PostgREST en infoanav-server

Esta guia explica como trabaja PostgREST dentro del gateway: por que hay un servidor Node delante, como se autentica el gateway ante PostgREST, como se consulta `/api/data` y como depurar. Los ejemplos se probaron contra el stack de Docker de este repositorio.

## Por que Node va por encima

PostgREST expone las tablas de un esquema como una API REST. Por si solo no sabe nada de usuarios de la aplicacion ni de roles de negocio, y su modelo de seguridad esta pensado para que cada peticion llegue con un JWT que la base de datos entiende.

Aqui el gateway hace tres cosas que PostgREST no hace:

1. Autentica al usuario (login, refresh, logout) contra `auth.usuarios_sistema` y emite su propio access token.
2. Autoriza cada peticion con la matriz de `src/modules/data/policy.ts`: recurso, metodo, rol y filtro obligatorio para `PATCH` y `DELETE`.
3. Firma un JWT interno de 30 segundos para cada peticion que reenvia a PostgREST. Ese JWT lleva el rol de base de datos y el usuario de la aplicacion.

PostgREST queda en `127.0.0.1` y no recibe trafico de internet. El cliente nunca recibe un token de PostgREST ni conoce su direccion.

## JWT interno y auditoria

`src/lib/tokens.ts` define `signInternalToken(usuario)`. Por cada peticion a `/api/data` firma:

```json
{ "role": "api_service", "usuario": "admin", "iat": 1760000000, "exp": 1760000030 }
```

- Se firma con HS256 y `POSTGREST_JWT_SECRET`. PostgREST lo valida con el mismo secreto, que el gateway le pasa como `PGRST_JWT_SECRET` al arrancarlo.
- `role` indica a PostgREST que ejecute la peticion como el rol de base de datos `api_service`.
- `usuario` identifica a la persona que hizo la peticion. El gateway lo toma del access token ya verificado, no del cliente.
- Caduca a los 30 segundos. Solo sirve para la peticion que lo genera.

PostgREST copia el payload del token en la variable de sesion `request.jwt.claims`. Los triggers de la base de datos la leen con `current_setting('request.jwt.claims', true)`:

- `api.set_audit_fields()` rellena `created_by` y `updated_by` en `INSERT` y `UPDATE`, y `deleted_by` cuando un registro pasa a baja. Si no hay usuario en el token, usa `sistema`.
- `api.log_changes()` escribe en `api.historial_cambios` el usuario, la operacion y los valores antes y despues. Lo usan `senales`, `fallas`, `mantenimientos` y `equipamientos_senal`.

Por eso el campo `usuario` del token importa: si cambia, cambian los datos de auditoria.

## Esquema expuesto

El gateway arranca PostgREST con `PGRST_DB_SCHEMAS=api`. Solo las tablas, vistas y funciones del esquema `api` son accesibles. El esquema `auth` (usuarios, refresh tokens) nunca se expone.

Las migraciones quitan RLS de todas las tablas de `api` y dan al rol `api_service` `ALL` sobre tablas y secuencias. La autorizacion la decide el gateway, no la base de datos. Por eso el puerto de PostgREST no debe publicarse nunca.

## Consultas

Todos los ejemplos usan esta variable. El token se obtiene con login (ver el README, seccion 7):

```sh
B=http://localhost:8080
TOKEN=$(curl -s -X POST $B/api/auth/login -H 'Content-Type: application/json' \
  -d '{"usuario":"admin","contrasena":"Admin12345!"}' | jq -r .accessToken)
```

### Seleccionar columnas y ordenar

```sh
curl -s "$B/api/data/senales?select=codigo_lsm,nombre&order=codigo_lsm.desc&limit=2" \
  -H "Authorization: Bearer $TOKEN"
```

Respuesta (recortada):

```json
[{"codigo_lsm":"S-003","nombre":"Paso Gamma"},{"codigo_lsm":"S-002","nombre":"Cruce Beta"}]
```

`order` admite `campo.asc` y `campo.desc`. Se pueden encadenar separando por comas.

### Filtros

El filtro va en la query como `columna=operador.valor`:

```sh
# igualdad
curl -s "$B/api/data/senales?codigo_lsm=eq.S-001&select=codigo_lsm" -H "Authorization: Bearer $TOKEN"
# distinto
curl -s "$B/api/data/senales?nombre=neq.Paso%20Gamma&select=nombre" -H "Authorization: Bearer $TOKEN"
# mayor y menor o igual (rango con dos condiciones sobre la misma columna)
curl -s "$B/api/data/senales?fecha_instalacion=gt.2021-01-01&fecha_instalacion=lte.2022-12-31&select=codigo_lsm" -H "Authorization: Bearer $TOKEN"
# busqueda sin distinguir mayusculas (* es comodin)
curl -s "$B/api/data/senales?nombre=ilike.*cruce*&select=nombre" -H "Authorization: Bearer $TOKEN"
# lista de valores
curl -s "$B/api/data/senales?codigo_lsm=in.(S-001,S-003)&select=codigo_lsm" -H "Authorization: Bearer $TOKEN"
# nulos
curl -s "$B/api/data/senales?id_zona=is.null&select=codigo_lsm" -H "Authorization: Bearer $TOKEN"
curl -s "$B/api/data/senales?fecha_instalacion=not.is.null&select=codigo_lsm" -H "Authorization: Bearer $TOKEN"
```

Operadores que acepta PostgREST: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`, `in`, `is` (con `null`), y la negacion con `not.` delante, por ejemplo `not.is.null`.

Para una condicion OR se usa `or=(...)`. Las comillas de la URL son obligatorias para que el shell no interprete los parentesis:

```sh
curl -s "$B/api/data/senales?or=(codigo_lsm.eq.S-001,codigo_lsm.eq.S-003)&select=codigo_lsm" \
  -H "Authorization: Bearer $TOKEN"
```

Respuesta: `[{"codigo_lsm":"S-001"},{"codigo_lsm":"S-003"}]`.

### Paginacion y Content-Range

`limit` y `offset` cortan la pagina. Para saber el total, se pide `Prefer: count=exact`:

```sh
curl -s -D - "$B/api/data/senales?select=codigo_lsm&order=codigo_lsm.asc&limit=2&offset=1" \
  -H "Authorization: Bearer $TOKEN" -H "Prefer: count=exact"
```

Cabeceras relevantes:

```
HTTP/1.1 206 Partial Content
content-range: 1-2/3
```

`Content-Range` tiene la forma `desde-hasta/total`. Con `Prefer: count=exact`, si la pagina no cubre todo el resultado, el estado es `206`. Si la pagina cubre todo, es `200`. Sin `Prefer: count=exact`, PostgREST no conoce el total y lo muestra como `*` (por ejemplo `content-range: 0-1/*`) con estado `200`.

La cabecera `Range` tambien pagina. Probado con una fila:

```sh
curl -s -D - "$B/api/data/senales?select=codigo_lsm" -H "Authorization: Bearer $TOKEN" -H "Range: 0-0" -H "Range-Unit: items"
```

Respuesta: `200`, `content-range: 0-0/*` y el cuerpo con una sola fila.

### Embebidos

Si hay una clave foranea, el recurso relacionado se incluye con su nombre de tabla:

```sh
curl -s "$B/api/data/fallas?select=causa_de_falla,senales(codigo_lsm,nombre)" \
  -H "Authorization: Bearer $TOKEN"
```

Respuesta:

```json
[{"causa_de_falla":"Cable cortado","senales":{"codigo_lsm":"S-001","nombre":"Cruce Alfa"}}]
```

### Bajas: un GET muestra tambien las filas dadas de baja

Las bajas son logicas. El gateway no filtra `deleted_at` por su cuenta, asi que un `GET` sin filtro devuelve tambien las filas dadas de baja. Para ver solo las activas hay que pedirlo:

```sh
curl -s "$B/api/data/senales?select=codigo_lsm,deleted_at&deleted_at=is.null" -H "Authorization: Bearer $TOKEN"
```

## Insercion

Una fila, con la representacion en la respuesta:

```sh
curl -s -X POST "$B/api/data/zonas" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -H 'Prefer: return=representation' \
  -d '{"nombre":"Norte"}'
```

`Prefer: return=representation` devuelve la fila creada (`201`). Sin esa cabecera, la respuesta es `201` con el cuerpo vacio.

En lote, se envia un array. Todos los objetos deben tener exactamente las mismas claves:

```sh
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$B/api/data/senales" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '[{"codigo_lsm":"S-001","nombre":"Cruce Alfa","id_zona":"<uuid>","fecha_instalacion":"2020-03-10T00:00:00"},
       {"codigo_lsm":"S-002","nombre":"Cruce Beta","id_zona":"<uuid>","fecha_instalacion":"2022-07-01T00:00:00"}]'
```

Si las claves no coinciden, PostgREST responde `400` con `PGRST102`:

```json
{"code":"PGRST102","details":null,"hint":null,"message":"All object keys must match"}
```

Un UUID invalido da `400` con `22P02` (`invalid input syntax for type uuid`).

## PATCH y DELETE

`PATCH` y `DELETE` exigen un filtro. Sin filtro, el gateway responde `400` antes de llegar a PostgREST:

```sh
curl -s -X PATCH "$B/api/data/senales" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"nombre":"x"}'
# {"error":"Se requiere un filtro para modificar o eliminar"}
```

Con filtro, se actualizan solo las filas que cumplen la condicion:

```sh
curl -s -X PATCH "$B/api/data/senales?codigo_lsm=eq.S-003" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -H 'Prefer: return=representation' -d '{"nombre":"Paso Gamma 2"}'
```

`DELETE` no borra fisicamente. Cada tabla con `deleted_at` tiene una regla `rl_soft_delete` que convierte el `DELETE` en un `UPDATE` de `deleted_at`, y la regla lleva `RETURNING *`. Por eso la respuesta trae la fila con `deleted_at` ya relleno:

```sh
curl -s -X DELETE "$B/api/data/senales?codigo_lsm=eq.S-002" \
  -H "Authorization: Bearer $TOKEN" -H 'Prefer: return=representation'
```

Respuesta (recortada): `[{"codigo_lsm":"S-002","deleted_at":"2026-10-16T12:15:37.566447+00:00","deleted_by":"admin",...}]`.

La migracion `20260101000500_soft_delete_returning` anadio `RETURNING *` a todas las reglas. Sin ella, cada `DELETE` falla con `cannot perform DELETE RETURNING`.

## RPC

Las funciones se llaman con `POST /api/data/rpc/<nombre>` y el cuerpo son sus argumentos como JSON. Solo se permiten las de `RPC_PERMITIDAS` en `policy.ts`. Hoy son:

- `get_dashboard_stats`
- `get_fault_analytics`
- `get_status_by_zone`
- `contar_inspecciones_por_senal` (ejemplo del README)

```sh
curl -s -X POST "$B/api/data/rpc/get_fault_analytics" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"p_mes":9,"p_anio":2026}'

curl -s -X POST "$B/api/data/rpc/get_status_by_zone" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{}'
```

Respuesta de `get_fault_analytics`: `[{"semana":"Semana 36","total_fallas":1,"tiempo_medio_resolucion":null}]`.

Una funcion fuera de la lista da `404`. Llamarla con `GET` da `405`, porque las RPC solo admiten `POST`:

```sh
curl -s "$B/api/data/rpc/get_status_by_zone" -H "Authorization: Bearer $TOKEN"
# {"error":"Metodo no permitido"}
```

## Errores

Hay dos formas de error y conviene reconocer cada una.

Errores del gateway (la matriz de `policy.ts` y el proxy), con la forma `{ "error": "..." }`:

- `401` `No autenticado`: falta el token o no se puede verificar.
- `403` `Sin permisos`: el rol no puede escribir ese recurso.
- `404` `No encontrado`: recurso fuera de la matriz.
- `405` `Metodo no permitido`.
- `400` `Se requiere un filtro para modificar o eliminar`.

Errores de PostgREST (incluido el de la base de datos), con la forma `{ code, message, details, hint }`:

```json
{"code":"22P02","details":null,"hint":null,"message":"invalid input syntax for type uuid: \"x\""}
```

La guarda de catalogos responde `409` cuando intentas dar de baja un registro de un catalogo que aun tiene registros activos que lo referencian. La funcion `api.prevent_delete_if_referenced()` lanza un error con `SQLSTATE 23503`, que PostgREST traduce a `409`:

```sh
curl -s -X DELETE "$B/api/data/zonas?id_zona=eq.<uuid>" \
  -H "Authorization: Bearer $TOKEN" -H 'Prefer: return=representation'
```

```json
{"code":"23503","details":null,"hint":"Referenciado desde api.senales","message":"El registro esta en uso"}
```

Antes de dar de baja un catalogo, hay que dar de baja o cambiar los registros que lo usan.

## Recarga del esquema

PostgREST guarda en cache la estructura de `api` (tablas, columnas, funciones, relaciones). Despues de crear o cambiar objetos hay que avisarle. Las migraciones lo hacen con:

```sql
NOTIFY pgrst, 'reload schema';
```

Si una tabla nueva responde 404 o no aparece en la especificacion, falta ese `NOTIFY` o la migracion no llego a ejecutarse.

## Por que se deshabilita RLS y quien autoriza

La migracion `20260101000200_api_service_access` desactiva RLS en todas las tablas de `api` y borra sus politicas. El rol `api_service` tiene `ALL` sobre esas tablas, y el unico JWT que lo activa lo firma el gateway. La base de datos no recibe JWT de usuarios finales, asi que no hay politicas por usuario que evaluar.

La autorizacion esta en tres sitios:

1. `policy.ts`: que recurso, metodo y rol estan permitidos. Es el primer filtro y el que se revisa al cambiar la matriz.
2. El filtro obligatorio para `PATCH` y `DELETE`.
3. Las reglas y guardas de la base de datos: baja logica y guarda de catalogos.

## Depuracion

- Swagger UI: con `ENABLE_DOCS=true` (valor por defecto en el compose), `GET /api/docs` muestra la especificacion de PostgREST con el esquema `bearerAuth`. La especificacion se pide a `/api/docs/openapi.json` y se guarda en cache durante 60 segundos. Solo para desarrollo.
- Logs: las lineas de PostgREST aparecen en la salida del gateway con el prefijo `[postgrest]`. En el stack probado aparece una linea por peticion, con la IP, el rol (`api_service`), el metodo, la ruta y el estado. Cada consulta a `/api/health`, incluida la del `HEALTHCHECK` de Docker, genera un `GET /` con `401` en ese log, porque el gateway sondea la raiz de PostgREST.
- Salud: `GET /api/health` responde `{ "status": "ok", "db": true, "postgrest": true }` cuando PostgREST y la base de datos contestan, y `503` si alguno no.
- Prueba directa: para aislar un problema, hacer la misma peticion con un JWT interno generado a mano con el mismo secreto. No se recomienda contra produccion.
- Cambios de esquema: si un recurso nuevo da 404 en el gateway, revisar `policy.ts`. Si da 404 o error de columna desde PostgREST, revisar la migracion y el `NOTIFY`.
