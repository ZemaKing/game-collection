// End-to-end tests (ROADMAP Phase 40) — `npm run test:e2e`. See e2e/README.md.
//
// READ-ONLY by the owner's decision (Open decision 3): the suite runs against the live Supabase
// project in `.env.local` and never writes. e2e/fixtures.ts fails any test whose page sends a
// non-GET request to Supabase, and answers Storage image requests with a tiny placeholder so a run
// costs almost no egress (the org's 5 GB/month is shared with another app).
//
// Browser: the locally installed Microsoft Edge (`channel: 'msedge'`), so no Playwright browser
// download. CI uses the runner's Chrome (E2E_CHANNEL=chrome).
//
// By default it tests a fresh production build of this checkout (`vite preview`). With
// E2E_BASE_URL=https://… it tests a deployed site instead (a Vercel preview, or production).
import { defineConfig, devices } from '@playwright/test'

// Not 4173, so a hand-started `npm run preview` of an older build is never reused.
const PORT = 4175
const channel = process.env.E2E_CHANNEL ?? 'msedge'
const deployedUrl = process.env.E2E_BASE_URL?.trim().replace(/\/+$/, '')

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'test-results/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // No retries: a flaky test should show up as flaky, not be hidden. Every failure keeps a trace.
  retries: 0,
  workers: process.env.CI ? 2 : 4,
  timeout: 45_000,
  expect: { timeout: 15_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: deployedUrl ?? `http://localhost:${PORT}`,
    channel,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    reducedMotion: 'reduce',
  },
  // The three layouts of the Working Rules: the sidebar from md (768 px), the bottom tab bar and
  // menu sheet below it.
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        channel,
        viewport: { width: 1280, height: 900 },
      },
    },
    {
      name: 'tablet',
      use: {
        ...devices['iPad Mini'],
        defaultBrowserType: 'chromium',
        channel,
      },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel } },
  ],
  webServer: deployedUrl
    ? undefined
    : {
        // Always a fresh production build: what visitors get.
        command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: false,
        timeout: 180_000,
        stdout: 'ignore',
        stderr: 'pipe',
      },
})
