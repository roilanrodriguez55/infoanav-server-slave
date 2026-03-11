# INFOANAV – Cliente (Slave)

Frontend del **Sistema de Gestión INFOANAV**: panel de administración y dashboard basado en React, TypeScript y Tailwind CSS. Incluye autenticación, sidebar colapsable con estado persistente, notificaciones, perfil de usuario y vistas preparadas para integrarse con un backend (ej. PocketBase).

## Descripción del proyecto

- **Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router 7.
- **UI:** Layout con header, sidebar (expandido/colapsado persistente en `localStorage`), dropdowns de usuario y notificaciones.
- **Páginas:** Inicio, autenticación (login), perfil de usuario, páginas de error y plantillas reutilizables.
- **Componentes:** Formularios, tablas, gráficos (ApexCharts), calendario (FullCalendar), mapas (jVectorMap) y elementos de formulario (flatpickr, dropzone, etc.).

El proyecto parte del template [TailAdmin](https://tailadmin.com) y está adaptado para el ecosistema INFOANAV.

## Requisitos previos

- **Node.js** 18.x o superior (recomendado 20.x).
- **npm** o **yarn** / **pnpm**.

## Configuración paso a paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/<tu-org>/infoanav-client-slave.git
cd infoanav-client-slave
```

### 2. Instalar dependencias

```bash
npm install
```

O con yarn:

```bash
yarn install
```

### 3. Variables de entorno (opcional)

Si en el futuro se usan variables de entorno (por ejemplo para la URL del API), crea un archivo `.env` en la raíz:

```bash
# Ejemplo cuando se configure backend
# VITE_API_URL=https://tu-api.com
```

Por ahora el proyecto no requiere variables obligatorias.

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

La app estará disponible en `http://localhost:5173` (o el puerto que indique Vite).

### 5. Build para producción

```bash
npm run build
```

Los artefactos se generan en `dist/`.

### 6. Vista previa del build

```bash
npm run start
```

Sirve la versión generada con `npm run build` para probar en local.

### 7. Linting

```bash
npm run lint
```

## Scripts disponibles

| Script   | Descripción                          |
|----------|--------------------------------------|
| `dev`    | Servidor de desarrollo (Vite)       |
| `build`  | Lint + TypeScript + build de producción |
| `start`  | Servidor de vista previa del build   |
| `lint`   | Ejecuta ESLint                      |

## Estructura básica

```
src/
├── components/   # Componentes reutilizables (auth, header, layout, etc.)
├── context/      # Contextos React (Sidebar, etc.)
├── layout/       # AppLayout, AppSidebar, AppHeader
├── pages/        # Páginas por ruta (Dashboard, Auth, perfil, etc.)
├── icons/        # Iconos SVG/React
├── App.tsx
└── main.tsx
```

## Licencia

MIT (ver [LICENSE.md](./LICENSE.md)).
