import { defineConfig } from '@playwright/test';
import config from './playwright.config';

export default defineConfig({
  ...config,
  testDir: './e2e/live',
  testIgnore: [],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  outputDir: 'test-results/live',
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/live', open: 'never' }]],
  webServer: [
    config.webServer as any,
    { command: 'node e2e/start-api.cjs', url: 'http://localhost:3000/health', reuseExistingServer: false, timeout: 240000 },
  ],
});
