import { defineConfig, devices } from '@playwright/test'

const isCI = Boolean(process.env.CI)
const e2eTarget = process.env.E2E_TARGET ?? 'app'
const isStorybookTarget = e2eTarget === 'storybook'
const webPort = Number(process.env.E2E_WEB_PORT ?? (isStorybookTarget ? 6006 : 4173))
const webUrl = `http://localhost:${webPort}`
const webCommand = isStorybookTarget
  ? `bun run storybook -- --port ${webPort} --ci --no-open`
  : `bun run dev -- --port ${webPort} --strictPort`

export default defineConfig({
  testDir: './e2e',
  timeout: 180_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  outputDir: './e2e/artifacts/test-results',
  use: {
    baseURL: webUrl,
    trace: 'on-first-retry',
    screenshot: 'off',
    video: 'off',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  webServer: [
    {
      command: webCommand,
      url: webUrl,
      reuseExistingServer: !isCI,
      stdout: 'pipe',
      stderr: 'pipe',
      timeout: 120_000,
    },
  ],
})
