import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: ['**/smooth_mode.spec.ts', '**/csp.spec.ts'],
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8081',
    reuseExistingServer: true,
    timeout: 30_000,
    env: {
      VITE_TEST_AUTH_BYPASS: 'true',
    }
  },
  projects: [
    {
      name: 'Mobile Chromium',
      use: {
        ...devices['iPhone 12'],
        browserName: 'chromium',
      },
    },
  ],
});
