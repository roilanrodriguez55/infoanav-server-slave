# INFOANAV cliente

## 1. Que es

Frontend del Sistema de Gestion INFOANAV: senales, fallas, mantenimientos, catalogos y usuarios. Esta hecho con React 19, Vite, Tailwind 4 y React Router 7.

El cliente habla solo con el gateway Node, bajo el prefijo `/api`. Nunca llama a PostgREST. Las peticiones de datos van a `/api/data`, las de sesion a `/api/auth` y las de usuarios a `/api/users`.

El servidor vive en la raiz de este mismo repositorio. Su `README.md` y la carpeta `../docs/` describen el sistema completo, el gateway, los permisos y las migraciones.

## 2. Requisitos y arranque en desarrollo

Requisitos:

- Node.js 24 o superior. `package.json` no declara `engines`, pero la imagen Docker usa `node:24-bookworm-slim` y el servidor pide Node 24.
- npm.
- El servidor corriendo en `http://localhost:8080`.

Pasos:

1. Instalar dependencias con `npm install`. Si quieres instalar exactamente lo que dice `package-lock.json`, usa `npm ci`.
2. Copiar `.env.example` a `.env`. Con el valor por defecto (`VITE_API_URL=/api`) no hace falta cambiar nada en desarrollo.
3. Arrancar el servidor. Escucha en `PORT`, que por defecto es 8080.
4. Ejecutar `npm run dev`. Vite sirve la app en `http://localhost:5173` (`strictPort: true`, si el puerto esta ocupado falla en vez de cambiar).

En desarrollo, `vite.config.ts` reenvia `/api` a `http://localhost:8080`. El navegador ve un solo origen (`localhost:5173`), asi que no hace falta CORS. Abre la app en `http://localhost:5173`, que es la URL con el proxy.

Vite lee las variables al arrancar. Si cambias `.env`, reinicia `npm run dev`.

## 3. Variables de entorno

| Variable | Donde se usa | Descripcion |
|---|---|---|
| `VITE_API_URL` | Cliente (build y dev) | Base de la API. Por defecto `/api`. Relativa: en dev la resuelve el proxy de Vite, en produccion nginx. Absoluta (por ejemplo `https://api.ejemplo.com/api`): dominios separados, y el servidor necesita `CORS_ORIGIN`. Vite la incrusta en el build, asi que en produccion cambiarla exige recompilar. |
| `SERVER_COMPOSE` | `docker-compose.yml` de este repo | Ruta al `docker-compose.yml` del servidor. Por defecto `../docker-compose.yml`, relativa a client/. En un worktree conviene la ruta absoluta. |
| `WEB_HOST_PORT` | `docker-compose.yml` de este repo | Puerto del host para el frontend. Por defecto `8081`. |
| `API_UPSTREAM` | Contenedor `web` | Destino del proxy de nginx. El compose lo fija en `http://api:8080`. |

`VITE_API_URL` tambien llega al build de Docker como argumento (`args` en `docker-compose.yml`).

Las variables de compose de la tabla no son del cliente. Solo las lee Docker Compose al levantar el stack.

## 4. Autenticacion en el cliente

- Login: `POST /api/auth/login` (`authService.login`). El access token se guarda solo en memoria, en `src/services/config/tokenStore.ts`. Nunca va a `localStorage` ni a `sessionStorage`.
- Cada peticion a `/api/data` y `/api/users` lleva `Authorization: Bearer <token>`. Lo agrega un interceptor en `src/services/config/axiosConfig.ts`.
- El refresh token es una cookie `httpOnly` que el cliente no puede leer. El navegador la envia a `/api/auth` porque las peticiones usan `withCredentials`.
- Arranque: `AuthProvider` llama a `authService.refresh()` al montarse. Mientras responde, las rutas protegidas muestran un spinner. Si funciona, la sesion se restaura sin pedir contrasena. Si falla, la app muestra `/signin`. Por eso recargar la pagina no cierra la sesion: el access token se pierde, pero la cookie lo renueva.
- Ante un 401, el interceptor llama a `refreshSession()`. Todas las peticiones concurrentes que reciben 401 esperan la misma promesa (`refreshPromise`), asi que solo sale un refresh. Cada peticion se reintenta una sola vez (marca `_retry`). Los 401 de `/auth/login` y `/auth/refresh` no se reintentan.
- Si el refresh falla: se borra el access token, el estado de sesion se limpia y `window.location.assign('/signin')` lleva al login. La peticion original termina con error.
- Logout: `POST /api/auth/logout`. Aunque la llamada falle, el token en memoria se borra y la sesion queda cerrada en el cliente.
- Limitacion con dos pestanas: cada pestana tiene su propio access token en memoria, y la deduplicacion del refresh solo funciona dentro de una pestana. Si dos pestanas refrescan a la vez con la misma cookie, el servidor trata la segunda como reuso y revoca la familia de tokens. La pestana afectada vuelve a `/signin`. Ver la seccion 4 (Limitaciones conocidas) del `README.md` del servidor.

## 5. Roles y pantallas

Roles (`src/types/auth.types.ts`): `administrador` y `usuario`. `AuthContext` expone `isAdmin` para el rol `administrador`.

Rutas de `src/App.tsx`:

| Ruta | Acceso | Notas |
|---|---|---|
| `/signin` | Publica | Si ya hay sesion, redirige a `/`. |
| `/` y `/dashboard` | Protegida | Dashboard. |
| `/gestion-senales`, `/gestion-fallas`, `/gestion-mant` | Protegida | Listas. |
| `/gestion-senales/:id`, `/gestion-fallas/:id`, `/gestion-mant/:id` | Protegida | Detalle con historial de cambios. |
| `/gestion-senales/nuevo`, `/gestion-senales/editar/:id` (idem `fallas` y `mant`) | Protegida, sin layout | Formularios a pantalla completa. |
| `/usuarios`, `/catalogos` | Solo administrador | Un `usuario` que entra por URL vuelve a `/`. |
| Cualquier otra ruta | Redireccion | A `/` si hay sesion, a `/signin` si no. |

Que ve cada rol:

- `usuario`: Dashboard, Senales, Fallas y Mantenimientos, con sus listas, detalles y formularios. No ve Usuarios ni Catalogos en el menu. El servidor tambien rechaza las escrituras en catalogos con 403.
- `administrador`: lo mismo mas Usuarios (`/usuarios`) y Catalogos (`/catalogos`).

Modulos ocultos. `navItems` en `src/layout/AppSidebar.tsx` acepta `hidden: true` para esconder una entrada del menu. Hoy ninguna entrada lo usa, asi que todos los modulos con ruta aparecen en el menu segun el rol.

## 6. Listas con filtros de servidor

Las listas no cargan toda la tabla. Cada cambio de pagina, orden o filtro hace una peticion nueva.

- `src/hooks/useServerList.ts` es el hook. Recibe `path` (por ejemplo `/senales`, que se une a `/api/data`), `select`, `pageSize` (20 por defecto), `defaultOrder`, `initialFilters`, `toFilters`, `searchColumns`, `searchKey` y `debounceMs` (300 ms). Devuelve `rows`, `total`, `page`, `setPage`, `order`, `toggleOrder`, `filters`, `setFilter`, `resetFilters`, `loading`, `error` y `reload`.
- Cada peticion envia `Prefer: count=exact`. El total sale de `Content-Range`. Si la cabecera falta, cuenta las filas recibidas. La peticion anterior se cancela al cambiar la consulta.
- `src/lib/postgrest.ts` construye la query. Operadores: `eq`, `neq`, `gte`, `lte`, `gt`, `lt`, `ilike`, `is`, `not_is` e `in`. Los filtros con valor vacio se ignoran. `dateRangeFilters(columna, desde, hasta)` genera un rango de fechas.
- La busqueda libre usa `searchColumns` y `searchKey`. Se aplica 300 ms despues de dejar de escribir y genera `or=(columna.ilike.*texto*,...)`. Los caracteres `, ( ) * " \` se quitan del texto.
- Todas las consultas agregan `deleted_at=is.null`. Los registros dados de baja no aparecen en ninguna lista.

Componentes comunes (`src/components/common/`):

- `FilterBar` envuelve los filtros y el boton "Limpiar filtros". Ese boton se desactiva cuando `activeCount` es 0. Cada filtro va dentro de un `FilterField` con su etiqueta.
- `Pagination` recibe `page`, `pageSize`, `total`, `onPageChange` y `loading`.
- `SortableHead` recibe `column`, `label`, `order` y `onSort`. Conecta con `toggleOrder` del hook.

Ejemplo, tomado de `src/pages/Tables/ListSenales.tsx`:

```ts
const toFiltros = (filtros: FiltrosSenales): Filter[] => [
  { column: 'id_tipo', op: 'eq', value: filtros.id_tipo },
  ...dateRangeFilters('created_at', filtros.desde, filtros.hasta),
];

const { rows, total, page, pageSize, setPage, order, toggleOrder, filters, setFilter, resetFilters, loading, error } =
  useServerList<Senal, FiltrosSenales>({
    path: '/senales',
    select: COLUMNAS_LISTA,
    defaultOrder: { column: 'created_at', dir: 'desc' },
    initialFilters: FILTROS_INICIALES,
    toFilters: toFiltros,
    searchColumns: ['codigo_lsm', 'nombre', 'ubicacion'],
    searchKey: 'texto',
  });
```

Para agregar un filtro nuevo a esa lista:

1. Agrega el campo al tipo `FiltrosSenales` y a `FILTROS_INICIALES`.
2. Agrega una entrada a `toFiltros`, con `op: 'eq'` si es un id.
3. En el JSX, dentro de `FilterBar`, agrega un `FilterField` con un select que llame a `setFilter('nombre_campo', valor === TODOS ? '' : valor)`. Es el mismo patron que usan los filtros de tipo, estado y zona.

Para una lista nueva, copia `ListSenales.tsx` y cambia `path`, `select` y los filtros. El recurso tiene que estar permitido en el servidor (`src/modules/data/policy.ts`). Si no lo esta, la API responde 404 o 405.

Detalle e historial. Las pantallas `SenalDetalle`, `FallaDetalle` y `MantenimientoDetalle` son de consulta. La edicion va a las rutas `editar/:id`. Cada detalle incluye `HistorialCambios`, que pide a `/api/data/historial_cambios` los registros de su tabla e id, ordenados por fecha descendente y con un maximo de 50.

## 7. Catalogos

`/catalogos` es una pantalla unica para el administrador. Los botones de la parte superior eligen el catalogo, que sale de la lista `CATALOGOS` de `src/config/catalogos.ts`. Dentro de cada catalogo se puede listar, crear (campo "Nuevo registro"), renombrar y dar de baja, con confirmacion. Las llamadas van a `/api/data/<tabla>` desde `src/services/api/catalogosAdminApi.ts`.

Los selects de los formularios solo eligen valores que ya existen. No permiten crear uno nuevo: para eso se usa la pantalla de Catalogos.

Para agregar un catalogo nuevo:

1. En el servidor, la tabla tiene que existir con su columna de clave primaria y una columna `nombre`, y el recurso tiene que estar en la lista de catalogos de `src/modules/data/policy.ts` del servidor. Lectura para ambos roles, escritura solo para administrador.
2. En el cliente, agrega una entrada a `CATALOGOS` en `src/config/catalogos.ts` con `tabla`, `pk` y `etiqueta`.
3. El catalogo aparece en la pantalla de Catalogos. No aparece automaticamente en los formularios. Los selects de formulario salen de la funcion `getCatalogos` de `src/services/api/senalesApi.ts`, que tiene su lista fija, asi que hay que agregarlo alli y en el formulario que lo use.

## 8. Estructura de `src`

```
src/
  main.tsx, App.tsx          arranque y rutas
  index.css
  components/
    auth/                    formulario de inicio de sesion
    common/                  FilterBar, Pagination, SortableHead, HistorialCambios, PageMeta, ThemeToggleButton
    header/                  dropdowns del encabezado (notificaciones y usuario)
    ui/                      componentes base (botones, dialogos, tablas, selects)
  config/catalogos.ts        catalogos que administra la pantalla de Catalogos
  context/                   AuthContext, SidebarContext, ThemeContext
  hooks/useServerList.ts     listas con filtros, orden y paginacion en servidor
  layout/                    AppLayout, AppHeader, AppSidebar, Backdrop
  lib/                       postgrest.ts (constructor de consultas), utils.ts
  pages/                     Dashboard, Tables (listas), Detalle, Forms, Catalogos, Usuarios
  services/api/              llamadas por dominio: auth, senales, fallas, mantenimientos, catalogos, usuarios, historial
  services/config/           axiosConfig.ts (instancias, interceptores y refresh), tokenStore.ts
  types/                     tipos de sesion (auth.types.ts)
```

## 9. Scripts npm

| Script | Comando | Uso |
|---|---|---|
| `npm run dev` | `vite` | Servidor de desarrollo en el puerto 5173. |
| `npm run build` | `eslint . && tsc -b && vite build` | Lint, comprobacion de tipos y build a `dist/`. Falla si hay errores en cualquiera de los tres pasos. |
| `npm run lint` | `eslint .` | Solo ESLint. |
| `npm run start` | `vite preview` | Sirve `dist/` para revisar el build en local. |
| `npm run test:e2e` | `playwright test` | Tests e2e. Hoy no hay specs (ver la seccion 12). |
| `npm run test:e2e:ui` | `playwright test --ui` | Tests e2e en modo UI. |
| `npm run test:e2e:headless` | `playwright test --headless` | Tests e2e sin ventana. |
| `npm run test:e2e:debug` | `playwright test --debug` | Tests e2e en modo debug. |
| `npm run test:e2e:report` | `playwright show-report` | Abre el reporte HTML. |

## 10. Docker para desarrollo y demos

Docker sirve para levantar el stack completo en una maquina de desarrollo o para una demo. No es para produccion.

```sh
docker compose up --build
```

El comando levanta tres servicios:

- `db` y `api`, del compose del servidor. Se incluyen con `include` desde `docker-compose.yml`.
- `web`, este repo. Se construye con `Dockerfile` (build con Vite y salida con nginx) y queda en `http://localhost:8081`.

nginx del contenedor `web` sirve el SPA y hace proxy de `/api` a `api:8080`. `web` arranca cuando `api` pasa su healthcheck.

Si el repo del servidor no esta al lado de este (por ejemplo, en un worktree), indica la ruta absoluta de su compose:

```sh
SERVER_COMPOSE=/ruta/absoluta/docker-compose.yml docker compose up --build
```

Usuario de demo: `admin` con contrasena `Admin12345!`. Son los valores del compose del servidor. Solo para demo: cambialos antes de cualquier uso real.

Para apagar el stack y borrar la base de datos: `docker compose down -v`. El `-v` borra los datos.

## 11. Produccion sin Docker

1. Compilar: `npm ci && npm run build`. Genera `dist/`. El build ejecuta lint y tipos antes de Vite, asi que tambien tiene que pasar `npm run lint`.
2. Servir `dist/` con nginx, con fallback SPA y proxy de `/api` al gateway. Ejemplo (las rutas y el dominio son de referencia):

```nginx
server {
    listen 443 ssl http2;
    server_name app.ejemplo.com;

    ssl_certificate     /ruta/al/fullchain.pem;
    ssl_certificate_key /ruta/al/privkey.pem;

    root /var/www/infoanav-client/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

   Agrega un bloque `server` en el puerto 80 que redirija a HTTPS. Con este esquema el cliente y la API comparten dominio y no hace falta CORS. En el servidor, `COOKIE_SECURE=true` exige HTTPS y `TRUST_PROXY=1` hace que el limite de intentos use la IP real.

   `nginx/default.conf.template` del repo es la referencia que usa la imagen Docker. Ademas de este fallback, cachea `/assets/` con `max-age=31536000`, porque Vite les pone hash en el nombre.

3. Dominios separados. Si el cliente vive en `app.ejemplo.com` y la API en `api.ejemplo.com`:
   - Antes de `npm run build`, define `VITE_API_URL=https://api.ejemplo.com/api`. Es absoluta y se incrusta en el build.
   - En el servidor, `CORS_ORIGIN=https://app.ejemplo.com`.
   - Los dos subdominios tienen que ser del mismo sitio. La cookie tiene `SameSite=Strict`, asi que con dominios de sitios distintos el navegador no la envia y el refresh falla. Ese caso no esta soportado por el servidor.

## 12. Pruebas e2e

Los tests e2e se eliminaron a proposito y se reescribiran mas adelante. La configuracion se mantiene.

Lo que existe:

- `playwright.config.ts`: `testDir` en `./e2e/specs`, `baseURL` en `http://localhost:5173`, proyecto `chromium` y un worker. Arranca `npm run dev` como `webServer` y reutiliza un servidor ya levantado si `CI` no es `true`.
- `.env.test` (no versionado): variables `VITE_APP_URL`, `TEST_USER`, `TEST_PASSWORD`, `TEST_SENAL_CODIGO`, `TEST_FALLA_CAUSA`, `TEST_MANTENIMIENTO_IDENT` y `API_URL`.

Como empezar:

1. Crear `e2e/specs/01-algo.spec.ts`. Un test minimo puede ir a `/signin` y comprobar la URL.
2. Instalar el navegador con `npx playwright install chromium`.
3. Ejecutar `npm run test:e2e`.

Hasta que haya specs, `npm run test:e2e` falla con "No tests found". Es lo esperado. El login pasa por `/api/auth/login`, asi que los tests nuevos deben partir de ese flujo. Mas detalle en `e2e/README.md`.

## 13. Solucion de problemas

- 401 repetidos o sesion que se cierra sola. Revisa que la cookie llegue: abre la app desde el origen del cliente (en dev, `http://localhost:5173`). Con `COOKIE_SECURE=true` sobre HTTP el navegador no guarda la cookie. Si dos pestanas refrescan a la vez, la sesion se revoca (seccion 4). Un cambio de contrasena o de rol tambien cierra sesiones: hay que volver a entrar.
- CORS. El origen del navegador no coincide con `CORS_ORIGIN` del servidor en esquema, puerto o barra final. Con `VITE_API_URL` relativa no aparece este error.
- Cookie sin HTTPS. Con `COOKIE_SECURE=true` el navegador solo guarda la cookie por HTTPS. Sirve el sitio por HTTPS o, solo en local, pon `COOKIE_SECURE=false` en el servidor.
- Pantalla en blanco tras desplegar. Si nginx no tiene el fallback `try_files ... /index.html`, al recargar una ruta como `/gestion-senales` responde 404 y la pantalla queda vacia. Agrega el fallback del ejemplo de la seccion 11.
- Cambios de `VITE_API_URL` sin efecto. En dev, reinicia `npm run dev`. En produccion, recompila: el valor va dentro de `dist/`.
- Las listas muestran "No se pudieron cargar los datos". La peticion a `/api/data` fallo. Revisa que el servidor responda en `http://localhost:8080` y que el proxy de Vite apunte ahi.
