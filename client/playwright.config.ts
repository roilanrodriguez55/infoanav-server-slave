import { defineConfig, devices } from '@playwright/test';

const env = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } })
  .process?.env;

const baseURL = 'http://localhost:5173';

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  timeout: 120000,
  expect: {
    timeout: 10000,
  },
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: env?.CI !== 'true',
    timeout: 120000,
  },
});
