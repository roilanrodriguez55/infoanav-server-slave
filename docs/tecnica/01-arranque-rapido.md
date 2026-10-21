# Arranque rapido

Esta guia levanta el sistema completo desde cero: PostgreSQL, PostgREST, el gateway Node y el cliente. Solo cubre lo necesario para iniciar. Para ajustes avanzados, ver [02-servidor-avanzado.md](02-servidor-avanzado.md) (servidor y PostgREST) y [03-cliente-avanzado.md](03-cliente-avanzado.md) (cliente).

El servidor se arranca primero, porque el cliente habla con el gateway:

```
Cliente --> gateway Node (:8080) --> PostgREST (127.0.0.1:3000) --> PostgreSQL
```

Hay dos caminos. El camino A (Docker) levanta todo con un comando y es el mas corto para probar. El camino B (manual) sirve para desarrollar, porque el gateway y el cliente corren en tu maquina y se recargan al guardar.

## Requisitos

| Requisito | Version | Camino A (Docker) | Camino B (manual) |
|---|---|---|---|
| Docker y Docker Compose | Compose v2 con soporte del elemento `include` (version minima pendiente de confirmar) | Si | No |
| Node.js | 24 o superior | No | Si (servidor y cliente) |
| npm | El que trae Node 24 | No | Si |
| PostgreSQL | 17 recomendado | No, lo levanta Compose | Si |
| Binario de PostgREST | v14.x (el Dockerfile usa la 14.7) | No, viene en la imagen | Si |
| openssl | Cualquiera reciente | No | Si, para generar secretos |
| curl y jq | Cualquiera | Opcional, para comprobar | Opcional, para comprobar |

## Camino A: Docker

1. Entra en la carpeta del cliente y levanta el stack:

```sh
cd client
docker compose up -d --build
```

   El `docker-compose.yml` del cliente incluye el del servidor (ruta por defecto `../docker-compose.yml`), asi que un solo comando levanta `db`, `api` y `web`. El contenedor `web` arranca cuando `api` pasa su healthcheck. El healthcheck tiene un periodo inicial de 60 segundos, por eso el primer arranque tarda.

2. Puertos que quedan publicados en tu maquina:

| Servicio | Puerto en el host | Uso |
|---|---|---|
| `web` (nginx con el cliente) | 8081 | Abre la app en el navegador |
| `api` (gateway) | 8080 | API bajo `/api` |
| `db` (PostgreSQL) | 5437 | Acceso directo a la base |

   PostgREST no se publica. Escucha solo dentro del contenedor `api`. Si un puerto esta ocupado, exporta la variable antes del comando, por ejemplo `WEB_HOST_PORT=8090 docker compose up -d --build`. Las variables son `WEB_HOST_PORT`, `API_HOST_PORT` y `DB_HOST_PORT`.

3. Credenciales de demo:

| Dato | Valor |
|---|---|
| Usuario de la app | Lo define el primer administrador en el onboarding |
| Contrasena de la app | La que elijas en el onboarding |
| Usuario de PostgreSQL | `postgres` |
| Contrasena de PostgreSQL | `admin` |
| Base de datos | `infoanav` |

   Son valores de demo, definidos en el `docker-compose.yml` del servidor. Los secretos JWT tambien son de demo. Cambialos antes de cualquier uso real (ver la seccion de variables en 02).

4. Comprueba el gateway:

```sh
curl -s http://localhost:8080/api/health
```

   Respuesta esperada: `{"status":"ok","db":true,"postgrest":true}`.

5. Comprueba el login:

```sh
curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"usuario":"<tu usuario>","contrasena":"<tu contrasena>"}'
```

   Respuesta esperada: un JSON con `accessToken` y `usuario`.

6. Abre `http://localhost:8081` e inicia sesion con `admin`.

7. Para parar el stack, usa `docker compose down` desde `client/`. Para parar y borrar los datos de la base, usa `docker compose down -v`.

## Camino B: manual para desarrollo

Se levantan las piezas en este orden: PostgreSQL, el servidor (gateway con PostgREST como proceso hijo) y el cliente. Todos los comandos del servidor se ejecutan desde la raiz del repositorio. Los del cliente, desde `client/`.

### Paso 1. PostgreSQL

Arranca PostgreSQL 17 en `localhost:5432` y crea la base:

```sh
psql -h localhost -U postgres -c "CREATE DATABASE infoanav;"
```

Las migraciones crean los esquemas, el rol `api_service` y el resto de la estructura. La base solo tiene que existir.

El `.env.example` usa el usuario `postgres` con contrasena `postgres`. Si tu instalacion usa otra cuenta, ajusta `DATABASE_URL`. Para una cuenta con permisos propios, ver 02.

### Paso 2. Servidor: dependencias y `.env`

```sh
npm ci
cp .env.example .env
```

Genera dos secretos y pegalos en `.env`:

```sh
openssl rand -hex 32   # valor para JWT_ACCESS_SECRET
openssl rand -hex 32   # valor para POSTGREST_JWT_SECRET
```

Ajusta estas variables en `.env`:

```
JWT_ACCESS_SECRET=<primer valor de openssl>
POSTGREST_JWT_SECRET=<segundo valor de openssl>
```

El primer administrador no se configura en `.env`: se crea desde la pantalla de onboarding al abrir la web. Los secretos deben tener al menos 32 caracteres. El gateway lee `.env` desde el directorio en el que se ejecuta, por eso los comandos del servidor van desde la raiz.

Los administradores que existian antes de esta version no tienen codigo de recuperacion. Inicia sesion y genera el tuyo desde Usuarios con el boton "Codigo de recuperacion" en tu propia fila. Guardalo: se muestra una sola vez.

### Paso 3. Binario de PostgREST

La guia cubre Linux x86-64. Para otros sistemas, descarga el archivo que corresponda desde https://github.com/PostgREST/postgrest/releases y deja el binario en `bin/postgrest`, o ajusta `POSTGREST_BIN`.

```sh
mkdir -p bin
curl -L -o bin/postgrest.tar.xz https://github.com/PostgREST/postgrest/releases/download/v14.7/postgrest-v14.7-linux-static-x86-64.tar.xz
tar -xJf bin/postgrest.tar.xz -C bin
rm bin/postgrest.tar.xz
chmod 0755 bin/postgrest
bin/postgrest --version
```

### Paso 4. Migraciones y seed

```sh
npm run migrate
npm run seed
```

`npm run migrate` aplica las migraciones pendientes. `npm start` y `npm run dev` lo hacen antes de arrancar, asi que el paso es opcional, pero ejecutarlo a mano deja ver el error de una migracion sin arrancar el servidor. `npm run seed` carga los catalogos y los modelos de equipo. Ambos scripts son idempotentes segun sus cabeceras, asi que puedes repetirlos.

### Paso 5. Arranca el gateway

```sh
npm run dev
```

El comando recarga el gateway al guardar cambios en `src/`. Para arrancar sin recarga, usa `npm start`.

Al arrancar, el gateway aplica las migraciones, lanza PostgREST en `127.0.0.1:3000` y escucha en el puerto 8080. Debe aparecer la linea `Servidor listo en http://localhost:8080`.

### Paso 6. Comprueba el gateway

```sh
curl -s http://localhost:8080/api/health
```

Respuesta esperada: `{"status":"ok","db":true,"postgrest":true}`. Si `db` o `postgrest` valen `false`, revisa la salida del gateway. Las lineas de PostgREST llevan el prefijo `[postgrest]`.

Prueba el login con el administrador que pusiste en `.env`:

```sh
curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"usuario":"<tu usuario administrador>","contrasena":"<tu contrasena>"}'
```

### Paso 7. Arranca el cliente

En otra terminal:

```sh
cd client
cp .env.example .env
npm ci
npm run dev
```

Abre `http://localhost:5173`. Vite reenvia `/api` a `http://localhost:8080`, asi que con el valor por defecto `VITE_API_URL=/api` no hace falta tocar nada.

### Paso 8. Comprueba el sistema completo

Inicia sesion en `http://localhost:5173` con el administrador de `.env`. Si entras al panel principal, las tres piezas se comunican.

## Como comprobar cada pieza

| Pieza | Comprobacion (camino B) | Comprobacion (camino A) | Resultado esperado |
|---|---|---|---|
| PostgreSQL | `psql -h localhost -U postgres -d infoanav -c "SELECT 1;"` | `docker compose ps` muestra `infoanav-db` como healthy | Una fila con `1` |
| Migraciones | `npm run migrate:status` | `docker compose logs api`, buscando `Servidor listo` | `Database schema is up to date!` (camino B). En el camino A, la linea `Servidor listo` indica que las migraciones se aplicaron |
| PostgREST y gateway | `curl -s http://localhost:8080/api/health` | El mismo `curl` | `{"status":"ok","db":true,"postgrest":true}` |
| Login | `POST /api/auth/login` | El mismo `curl` | JSON con `accessToken` |
| Cliente | Abrir `http://localhost:5173` | Abrir `http://localhost:8081` | Pantalla de inicio de sesion y, tras entrar, el panel |

PostgREST no tiene un puerto de comprobacion propio. Su estado se ve en `postgrest` dentro de `/api/health`.

## Problemas comunes

- `node -v` muestra una version menor que v24. El gateway ejecuta archivos `.ts` directamente y necesita Node 24. Instala Node 24 y repite el paso 2.
- `No se encontro PostgREST en ./bin/postgrest`. El binario no esta en esa ruta. Repite el paso 3 o ajusta `POSTGREST_BIN`.
- `ENV <CAMPO>: <mensaje>` y salida inmediata. Falta una variable o no cumple la validacion. El mensaje dice cual. Lo mas comun es un secreto con menos de 32 caracteres.
- `Fallo al aplicar migraciones; no se inicia el servidor`. Revisa `DATABASE_URL` y que la base exista. Si la base ya tiene objetos de una version anterior, consulta la seccion de migraciones de 02 (el procedimiento para bases previas a la migracion `20260101000500` esta pendiente de confirmar).
- `El puerto de http://127.0.0.1:3000 ya esta en uso`. Otro programa ocupa el puerto de PostgREST. Libera el puerto o cambia `POSTGREST_URL`.
- No aparece la pantalla de onboarding. Solo se muestra mientras no exista ningun administrador. Si ya existe uno y se pierde su contrasena, usa "Olvide mi contrasena" con el codigo de recuperacion.
- `429` al iniciar sesion. Hubo 10 intentos fallidos desde la misma IP en 15 minutos. Espera.
- Las listas del cliente muestran "No se pudieron cargar los datos". El gateway no responde o PostgREST esta caido. Revisa `/api/health`.
- `NODE_ENV=production` en local. Con esa variable, `COOKIE_SECURE` vale `true` y el navegador no guarda la cookie de sesion por HTTP. Para desarrollo local deja `NODE_ENV=development`.
- Puerto 5173 ocupado en el cliente. Vite falla en vez de cambiar de puerto (`strictPort: true`). Libera el puerto.
- Catalogos vacios con Docker. La imagen del servidor no copia la carpeta `scripts/`, asi que `npm run seed` no esta disponible dentro del contenedor. Pendiente de confirmar la forma de cargar los catalogos en el stack Docker.
