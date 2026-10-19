# Tests e2e

## Estado

Los tests e2e fueron eliminados a proposito. Se reescribiran mas adelante. La configuracion de Playwright se mantiene.

## Configuracion que existe

- `playwright.config.ts`: `testDir` en `./e2e/specs`, `baseURL` en `http://localhost:5173`, arranca `npm run dev` como `webServer`, proyecto `chromium`, 1 worker.
- `.env.test`: variables `VITE_APP_URL`, `TEST_USER`, `TEST_PASSWORD`, `TEST_SENAL_CODIGO`, `TEST_FALLA_CAUSA`, `TEST_MANTENIMIENTO_IDENT` y `API_URL`. Es un archivo local no versionado (esta en `.gitignore`).
- Scripts de `package.json`:
  - `test:e2e`: ejecuta `playwright test`.
  - `test:e2e:ui`: ejecuta en modo UI.
  - `test:e2e:headless`: ejecuta en headless.
  - `test:e2e:debug`: ejecuta en modo debug.
  - `test:e2e:report`: abre el reporte HTML.

## Como empezar

1. Crear `e2e/specs/01-algo.spec.ts` con un test minimo:

```ts
import { test, expect } from '@playwright/test';

test('carga el login', async ({ page }) => {
  await page.goto('/signin');
  await expect(page).toHaveURL(/signin/);
});
```

2. Instalar navegadores: `npx playwright install chromium`.
3. Ejecutar: `npm run test:e2e`.

## Notas

- Mientras no haya specs, `npm run test:e2e` falla con "No tests found". Es lo esperado.
- El login ahora es contra el gateway Node (`/api/auth/login`) con access y refresh token. Los tests nuevos deben partir de ese flujo.
