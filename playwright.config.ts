import { defineConfig, devices } from '@playwright/test'

const FRONTEND_URL = process.env.E2E_FRONTEND_URL || 'http://localhost:3000'
const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:8000'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: 0,
  use: {
    baseURL: FRONTEND_URL,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'PORT=3000 NODE_ENV=test tsx server.ts',
      url: FRONTEND_URL,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'PORT=8000 uvicorn backend.main:app --reload',
      url: BACKEND_URL,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})


