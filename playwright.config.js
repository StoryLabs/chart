import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'test/browser',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:8791', channel: 'chrome', viewport: { width: 1280, height: 900 } },
  webServer: { command: 'bun test/browser/servidor.js', url: 'http://127.0.0.1:8791/', reuseExistingServer: false }
})
