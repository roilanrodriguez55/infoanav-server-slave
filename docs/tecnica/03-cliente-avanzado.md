# Cliente avanzado

Esta guia cubre la configuracion del cliente: variables `VITE_*`, proxy de Vite, build de produccion, nginx, dominios separados con CORS, Docker, estructura de `src`, listas con filtros de servidor, catalogos, pruebas e2e y solucion de problemas. Para levantar el sistema por primera vez, ver [01-arranque-rapido.md](01-arranque-rapido.md). Para el gateway y PostgREST, ver [02-servidor-avanzado.md](02-servidor-avanzado.md).

Las rutas de esta guia son relativas a `client/`. El servidor esta en la raiz del mismo repositorio, asi que desde el cliente se llega con `../`.

## 1. Variables de entorno

Vite lee `client/.env` (copia de `.env.example`) y `client/.env.local`. Solo llegan al codigo las variables con prefijo `VITE_`. El codigo del cliente lee una sola: `VITE_API_URL`, en `src/services/config/axiosConfig.ts`.

| Variable | Valor por defecto | Donde se usa | Uso |
|---|---|---|---|
| `VITE_API_URL` | `/api` | Vite (dev y build), build de Docker | Base de la API. Relativa (`/api`): en dev la resuelve el proxy de Vite y en Docker o produccion, nginx. Absoluta: dominios separados (seccion 5). |

`axiosConfig.ts` quita las barras finales de `VITE_API_URL` y anade `/auth` y `/data` a esa base. El `.env.example` documenta la forma absoluta con el prefijo `/api` incluido.

Las variables de la tabla siguiente no son del cliente. Solo las lee Docker Compose al levantar `client/docker-compose.yml`. Compose toma los valores del entorno del shell o del `.env` del directorio desde el que se ejecuta el comando.

| Variable | Valor por defecto | Uso |
|---|---|---|
| `SERVER_COMPOSE` | `../docker-compose.yml` | Ruta del compose del servidor que se incluye con `include`. En un worktree, usar la ruta absoluta. |
| `WEB_HOST_PORT` | `8081` | Puerto del host que publica el servicio `web`. |
| `VITE_API_URL` | `/api` | Se pasa como `args` al build de `web`. |
| `API_UPSTREAM` | `http://api:8080` | Fijada en `environment` del servicio `web`. Es el destino del proxy de nginx. |

## 2. Proxy de Vite en desarrollo

`vite.config.ts` fija estos valores de servidor:

- Puerto `5173` con `strictPort: true`. Si el puerto esta ocupado, Vite falla y no cambia de puerto.
- `host: true`. Vite escucha en todas las interfaces, no solo en `localhost`.
- Proxy de `/api` hacia `http://localhost:8080`, con `changeOrigin: false`. El `Host` que llega al gateway es el del navegador.

El destino del proxy esta escrito en `vite.config.ts`. No hay variable de entorno para cambiarlo. Si el gateway escucha en otro puerto, hay que editar ese archivo.

Con `VITE_API_URL=/api` el navegador solo ve el origen `http://localhost:5173`, asi que no hay CORS. Si se pone una URL absoluta, axios llama directamente al gateway sin pasar por el proxy. En ese caso el origen `http://localhost:5173` tiene que estar en `CORS_ORIGIN` del servidor.

## 3. Build de produccion

1. Instalar dependencias exactas: `npm ci`.
2. Compilar: `npm run build`. Ejecuta `eslint . && tsc -b && vite build`. Si falla cualquiera de los tres pasos, no se genera `dist/`.
3. Definir `VITE_API_URL` antes del build, si no es `/api`. Vite la incrusta en el JavaScript generado, asi que cambiarla exige recompilar.

El resultado es la carpeta `dist/`, que se sirve con nginx (seccion 4).

`npm run start` ejecuta `vite preview`, que sirve `dist/` para revisar el build en local.

## 4. nginx

### 4.1 Plantilla de la imagen

`client/nginx/default.conf.template` es la configuracion que usa la imagen Docker. Hace estas cosas:

- Sirve `/usr/share/nginx/html` con `index.html` y compresion gzip para CSS, JavaScript, JSON y SVG.
- `location /api/` hace `proxy_pass ${API_UPSTREAM}` sin barra final, asi que el prefijo `/api` se conserva al llegar al gateway. Fija `proxy_read_timeout 60s`.
- `location /assets/` sirve los ficheros con `Cache-Control: public, max-age=31536000, immutable`. Vite les pone hash en el nombre.
- `location /` usa `try_files $uri /index.html` y responde con `Cache-Control: no-cache`. Asi una ruta del SPA, como `/gestion-senales`, carga la aplicacion en vez de dar 404.

### 4.2 API_UPSTREAM

El `Dockerfile` define `ENV API_UPSTREAM=http://api:8080` y `NGINX_ENVSUBST_FILTER=API_UPSTREAM`. Al arrancar, la imagen de nginx sustituye en la plantilla solo la variable `API_UPSTREAM`. Las variables propias de nginx, como `$uri` o `$host`, quedan tal cual.

Compose fija el mismo valor en el servicio `web`. Para usar otro destino, cambiar `API_UPSTREAM` por una URL con esquema que alcance al gateway.

### 4.3 Limite de cuerpo

La plantilla no define `client_max_body_size`. nginx aplica su valor por defecto, que es 1 MB. El gateway acepta hasta 5 MB (ver [02-servidor-avanzado.md](02-servidor-avanzado.md), seccion 4). Una peticion de mas de 1 MB que pase por el contenedor `web` recibe `413` de nginx antes de llegar al gateway.

### 4.4 nginx sin Docker

La seccion 11 del `README.md` del cliente tiene un bloque de ejemplo para servir `dist/` en un servidor propio. Ese bloque no tiene la compresion gzip ni la cache de `/assets/` de la plantilla. La plantilla es la referencia para la imagen Docker.

## 5. Dominios separados y CORS

Ejemplo: el cliente en `app.ejemplo.com` y la API en `api.ejemplo.com`.

1. Cliente. Antes del build, definir `VITE_API_URL=https://api.ejemplo.com/api`. El cliente construye las URLs como `${VITE_API_URL}/auth/login` y `${VITE_API_URL}/data/...`, y el gateway sirve esas rutas bajo `/api`. Por eso el prefijo `/api` va incluido en la URL absoluta.
2. Servidor. En su `.env`, `CORS_ORIGIN=https://app.ejemplo.com`. El origen va con esquema y puerto, sin barra final.
3. Credenciales. Las dos instancias de axios (`authHttp` y `api`) usan `withCredentials: true`. El navegador envia la cookie de refresh y acepta la respuesta con credenciales.
4. Mismo sitio. La cookie de refresh es `SameSite=Strict`. Los dos subdominios deben ser del mismo sitio. Con sitios distintos el refresh falla, y el servidor no lo soporta (ver [02-servidor-avanzado.md](02-servidor-avanzado.md), seccion 3 y seccion 6).

En el stack Docker no hace falta CORS. nginx del contenedor `web` sirve `/api` en el mismo origen que la aplicacion.

## 6. Docker

Docker sirve para desarrollo y demos, no para produccion. Los comandos basicos estan en [01-arranque-rapido.md](01-arranque-rapido.md).

### 6.1 Imagen (`client/Dockerfile`)

Dos etapas:

- `build`, sobre `node:24-bookworm-slim`. Ejecuta `npm ci`, copia el proyecto, recibe `ARG VITE_API_URL=/api` y ejecuta `npx vite build`.
- Final, sobre `nginx:1.27-alpine`. Copia `dist/` a `/usr/share/nginx/html` y la plantilla a `/etc/nginx/templates/`. Expone el puerto 80. Su `HEALTHCHECK` pide `http://127.0.0.1/` con `wget`.

La etapa de build usa `npx vite build`, no `npm run build`. Por eso el build de Docker no pasa por ESLint ni por `tsc`.

### 6.2 Compose (`client/docker-compose.yml`)

- `include` carga el compose del servidor desde `${SERVER_COMPOSE:-../docker-compose.yml}`. Esa carga aporta los servicios `db` y `api`.
- `web` se construye desde `context: .` con el build arg `VITE_API_URL`. Su contenedor se llama `infoanav-web`, esta en la red `infoanav-network` y publica `${WEB_HOST_PORT:-8081}` en el puerto 80 del contenedor.
- `depends_on` de `api` con `condition: service_healthy`. `web` no arranca hasta que el gateway pasa su healthcheck.

### 6.3 Cambios y rebuild

- Cambiar `VITE_API_URL` exige reconstruir la imagen: `docker compose up -d --build` desde `client/`. El valor queda dentro de `dist/`.
- En un worktree, indicar la ruta absoluta del compose del servidor en `SERVER_COMPOSE`.

### 6.4 Contexto de build

`client/.dockerignore` excluye `.env*`, `e2e/`, `node_modules/`, `dist/` y `.git`. Por eso el valor de `VITE_API_URL` solo llega al build por el argumento de Compose, no por un `.env` copiado a la imagen.

## 7. Estructura de `src`

```
src/
  main.tsx, App.tsx          arranque y rutas
  index.css                  estilos globales
  svg.d.ts, vite-env.d.ts    tipos de los SVG y de Vite
  components/
    auth/                    formulario de inicio de sesion
    common/                  FilterBar, Pagination, SortableHead, HistorialCambios, ExportarTabla, PageMeta, ThemeToggleButton
    header/                  dropdowns del encabezado
    senal/                   componentes de senales
    ui/                      componentes base
  config/catalogos.ts        lista de catalogos de la pantalla de Catalogos
  context/                   AuthContext, SidebarContext, ThemeContext
  hooks/                     useServerList.ts, usePagedItems.ts
  layout/                    AppLayout, AppHeader, AppSidebar, Backdrop
  lib/                       postgrest.ts (constructor de consultas), utils.ts, alcanceLuminico.ts, intervalos.ts, planMantenimiento.ts
  pages/                     una carpeta por area: Dashboard, Tables, Detalle, Forms, Catalogos, Usuarios, Flota, Plantas, Hechos, Mantenimientos, Radioelectricas, Equipamiento, Estadisticas, Documentacion, Calculos
  services/api/             llamadas por dominio (senalesApi.ts, fallasApi.ts, catalogosAdminApi.ts, ...)
  services/config/           axiosConfig.ts (instancias, interceptores y refresh), tokenStore.ts
  services/dashboardService.ts
  types/                     tipos de sesion (auth.types.ts)
```

Las llamadas HTTP por dominio viven en `services/api/`. Las instancias de axios y sus interceptores salen de `services/config/axiosConfig.ts`.

## 8. Listas con filtros de servidor

Las listas no cargan la tabla completa. Cada cambio de pagina, orden, filtro o busqueda hace una peticion nueva a `/api/data`.

### 8.1 Hook `useServerList`

`src/hooks/useServerList.ts` recibe estas opciones:

| Opcion | Obligatoria | Uso |
|---|---|---|
| `path` | Si | Recurso de PostgREST, por ejemplo `/senales`. Se une a `/api/data`. |
| `initialFilters` | Si | Valores iniciales de los filtros. |
| `toFilters` | Si | Convierte el objeto de filtros de la pantalla en una lista de `Filter`. |
| `select` | No | Columnas y embebidos del `select=`. |
| `pageSize` | No | Filas por pagina. Por defecto 20. |
| `defaultOrder` | No | Orden inicial, `{ column, dir }`. |
| `searchColumns` | No | Columnas donde busca el texto libre. |
| `searchKey` | No | Clave de `initialFilters` que guarda el texto libre. |
| `debounceMs` | No | Retraso de la busqueda. Por defecto 300 ms. |

Devuelve `rows`, `total`, `page`, `pageSize`, `totalPages`, `setPage`, `order`, `toggleOrder`, `filters`, `setFilter`, `resetFilters`, `loading`, `error` y `reload`.

### 8.2 Reglas de la consulta

- Cada peticion envia `Prefer: count=exact`. El total sale de la cabecera `Content-Range`. Si la cabecera falta, el hook cuenta las filas recibidas.
- `buildQuery` (`src/lib/postgrest.ts`) agrega `deleted_at=is.null` a todas las consultas. Las filas dadas de baja no aparecen en ninguna lista.
- Un filtro con valor vacio o `null` se ignora. Excepcion: `is` y `not_is` admiten `null`. Un `in` con lista vacia tambien se ignora.
- Operadores de `FilterOp`: `eq`, `neq`, `gte`, `lte`, `gt`, `lt`, `ilike`, `is`, `not_is` e `in`.
- La busqueda libre genera `or=(columna.ilike.*texto*,...)` sobre `searchColumns`. Antes de enviar, quita los caracteres `,`, `(`, `)`, `*`, `"` y `\` del texto.
- La peticion anterior se cancela cuando cambia la consulta.

### 8.3 Agregar un filtro a una lista

Ejemplo de `src/pages/Tables/ListSenales.tsx`:

```ts
const toFiltros = (filtros: FiltrosSenales): Filter[] => [
  { column: 'id_tipo', op: 'eq', value: filtros.id_tipo },
  ...dateRangeFilters('created_at', filtros.desde, filtros.hasta),
];
```

Pasos:

1. Agregar el campo al tipo de filtros y a `initialFilters`.
2. Agregar una entrada a `toFiltros`. Para un id, usar `op: 'eq'`.
3. En el JSX, dentro de `FilterBar`, agregar un `FilterField` con un select que llame a `setFilter('campo', valor === TODOS ? '' : valor)`.

Para una lista nueva, copiar `ListSenales.tsx` y cambiar `path`, `select` y los filtros. El recurso tiene que estar permitido en el servidor, en `src/modules/data/policy.ts` (ver [02-servidor-avanzado.md](02-servidor-avanzado.md), seccion 4). Si no lo esta, la API responde `404` o `405`.

## 9. Catalogos

La pantalla `/catalogos` es solo para el rol `administrador`. Lista los catalogos de `CATALOGOS` en `src/config/catalogos.ts` y permite listar, crear, renombrar y dar de baja registros. Las llamadas van a `/api/data/<tabla>` desde `src/services/api/catalogosAdminApi.ts`.

Cada entrada de `CATALOGOS` tiene esta forma:

```ts
{ tabla: 'zonas', pk: 'id_zona', etiqueta: 'Zonas' }
```

El archivo tiene 30 entradas.

Los selects de los formularios no leen `CATALOGOS`. Salen de listas fijas en las funciones `getCatalogos` de cada servicio, por ejemplo `getCatalogos` en `src/services/api/senalesApi.ts`. Un catalogo nuevo solo aparece en esos formularios si se agrega tambien alli.

Para agregar un catalogo:

1. Servidor. La tabla debe existir en `api`, con su clave primaria y una columna `nombre`. El recurso debe estar en la lista de catalogos de `policy.ts`: lectura para ambos roles y escritura solo para el administrador.
2. Cliente. Agregar una entrada a `CATALOGOS` con `tabla`, `pk` y `etiqueta`.
3. Formularios, si hace falta. Agregar el catalogo a la funcion `getCatalogos` del servicio que lo use.

## 10. Pruebas e2e con Playwright

Hoy no hay tests. Los specs se eliminaron a proposito y se reescribiran mas adelante. Se mantiene la configuracion. `e2e/specs/` solo contiene `.gitkeep`.

`playwright.config.ts`:

| Ajuste | Valor |
|---|---|
| `testDir` | `./e2e/specs` |
| `baseURL` | `http://localhost:5173` |
| Workers | 1, sin `fullyParallel` |
| Reintentos | 1 |
| Reporter | `html` (sin abrir) y `list` |
| Traza, captura y video | Traza y video en el primer reintento; captura solo en fallo |
| Navegador | `chromium` con `Desktop Chrome`, en headless |
| Timeout del test | 120 s |
| Timeout de `expect` | 10 s |
| `webServer` | `npm run dev` en `baseURL`. Reutiliza un servidor ya levantado si `CI` no es `true` |

Scripts:

| Script | Comando |
|---|---|
| `npm run test:e2e` | `playwright test` |
| `npm run test:e2e:ui` | `playwright test --ui` |
| `npm run test:e2e:headless` | `playwright test --headless` |
| `npm run test:e2e:debug` | `playwright test --debug` |
| `npm run test:e2e:report` | `playwright show-report` |

Como empezar, segun `e2e/README.md`:

1. Instalar el navegador: `npx playwright install chromium`.
2. Crear `e2e/specs/01-algo.spec.ts`. Un test minimo puede ir a `/signin` y comprobar la URL:

```ts
import { test, expect } from '@playwright/test';

test('carga el login', async ({ page }) => {
  await page.goto('/signin');
  await expect(page).toHaveURL(/signin/);
});
```

3. Ejecutar `npm run test:e2e`.

El login pasa por `/api/auth/login`. Los tests que inicien sesion necesitan el gateway en `localhost:8080`, al que llega el proxy de Vite.

`e2e/README.md` y `README.md` del cliente citan un archivo `.env.test` con `VITE_APP_URL`, `TEST_USER`, `TEST_PASSWORD`, `TEST_SENAL_CODIGO`, `TEST_FALLA_CAUSA`, `TEST_MANTENIMIENTO_IDENT` y `API_URL`. Ningun archivo del repositorio lo carga.

## 11. Solucion de problemas

- Sesion que se cierra sola o `401` repetidos. La cookie de refresh no llega. Abrir la app desde el origen del cliente (en dev, `http://localhost:5173`). Con `COOKIE_SECURE=true` sobre HTTP, el navegador no guarda la cookie. Si dos pestanas refrescan a la vez, el servidor revoca la familia de tokens (ver [02-servidor-avanzado.md](02-servidor-avanzado.md), seccion 3).
- Error de CORS en el navegador. El origen de la pagina no coincide con `CORS_ORIGIN` del servidor en esquema, puerto o barra final. Con `VITE_API_URL` relativa no aparece este error.
- Peticiones a `/auth/...` que dan `404` con `VITE_API_URL` absoluta. Segun el codigo, el cliente llama a `${VITE_API_URL}/auth/login`. Si la URL no incluye `/api`, la peticion llega a una ruta que el gateway no sirve. Ver la seccion 5.
- Cambios de `VITE_API_URL` sin efecto. En dev, reiniciar `npm run dev`. En produccion, recompilar. En Docker, `docker compose up -d --build`.
- Pantalla en blanco o 404 al recargar una ruta del SPA en produccion. El servidor web no tiene el fallback `try_files ... /index.html`. Usar el bloque de la seccion 11 del `README.md` del cliente o la plantilla de la imagen.
- `413` en peticiones grandes a traves del contenedor `web`. nginx aplica su limite de 1 MB. Ver la seccion 4.3.
- Las listas muestran "No se pudieron cargar los datos". La peticion a `/api/data` fallo. Revisar que el gateway responda en `http://localhost:8080` (`/api/health`) y que el proxy de Vite apunte ahi.
- Puerto 5173 ocupado. Vite falla por `strictPort: true`. Liberar el puerto.
- `docker compose` no encuentra el compose del servidor. Revisar `SERVER_COMPOSE` y, en un worktree, usar la ruta absoluta.
- `npm run test:e2e` falla con "No tests found". Es lo esperado mientras no haya specs.

## 12. Pendientes de confirmar

- Estructura de `src` en el `README.md` del cliente. La seccion 8 no lista `components/senal`, `pages/Flota` ni otras carpetas de `pages/`. La estructura de esta guia sale de la carpeta actual.
- Carga de `.env.test`. Las variables de tests se documentan, pero ningun archivo del repositorio lee `.env.test`. `playwright.config.ts` no lo carga. Falta definir como se cargarian.
- `client/.env.local` esta versionado en git y contiene `VITE_API_URL`. El `.gitignore` del cliente solo ignora `.env` y `.env.test`. Vite lo carga con prioridad sobre `.env`. No esta documentado en el `README.md`.
- Limite de cuerpo en nginx. La plantilla no define `client_max_body_size`, y el gateway acepta 5 MB. No hay decision tomada sobre si la plantilla debe subirlo. El ejemplo de la seccion 6 del `02` usa `6m`.
- Proxy de `vite preview`. No se verifico si `npm run start` reenvia `/api` al gateway. Solo se confirma el proxy de `npm run dev`.
- Build de Docker sin lint ni `tsc`. La etapa `build` usa `npx vite build`, a diferencia de `npm run build`. Confirmar si es intencionado.
- Destino del proxy de Vite. Esta fijo en `http://localhost:8080` en `vite.config.ts`. No hay variable para cambiarlo.
