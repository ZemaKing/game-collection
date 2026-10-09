// Shared Playwright fixtures for the end-to-end suite (ROADMAP Phase 40).
//
// Every test gets these automatically:
//   - read-only: any non-GET/HEAD request from the page to Supabase is aborted and fails the test
//     (the suite runs against the live project, so nothing here may ever write);
//   - no image egress: Storage objects are answered with a 1×1 PNG, never downloaded;
//   - no uncaught page errors (render crashes, failed lazy chunks, …);
//   - English UI, so the tests can find controls by their accessible names. Only seeded when
//     the page has no settings yet, so a test that changes them still sees its change on reload.
// And `collection`: the live data from PostgREST (support/data.ts), the oracle for expected counts.
import { test as base, expect, type Page } from '@playwright/test'

import { fetchCollection, type Collection } from './support/data.ts'
import { supabaseOrigin } from './support/env.ts'

// A transparent 1×1 PNG.
const PLACEHOLDER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

type Fixtures = { guards: void }
type WorkerFixtures = { collection: Collection }

export const test = base.extend<Fixtures, WorkerFixtures>({
  collection: [
    // eslint-disable-next-line no-empty-pattern -- Playwright reads the fixture deps from this destructuring
    async ({}, use) => {
      await use(await fetchCollection())
    },
    { scope: 'worker' },
  ],

  guards: [
    async ({ page }, use) => {
      const blocked: string[] = []
      const pageErrors: string[] = []
      const origin = supabaseOrigin()

      await page.addInitScript(() => {
        if (!localStorage.getItem('settings'))
          localStorage.setItem('settings', JSON.stringify({ locale: 'en' }))
      })
      await page.route(`${origin}/**`, async (route) => {
        const request = route.request()
        const method = request.method()
        if (method !== 'GET' && method !== 'HEAD') {
          blocked.push(`${method} ${request.url()}`)
          return route.abort('blockedbyclient')
        }
        if (new URL(request.url()).pathname.startsWith('/storage/v1/object/'))
          return route.fulfill({
            status: 200,
            contentType: 'image/png',
            body: PLACEHOLDER_PNG,
          })
        return route.continue()
      })
      page.on('pageerror', (error) => pageErrors.push(error.message))

      await use()

      expect(
        blocked,
        'the E2E suite is read-only — these requests to Supabase were blocked',
      ).toEqual([])
      expect(pageErrors, 'uncaught errors in the page').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }

/** Below md (768 px) the app swaps the sidebar for the bottom tab bar and the menu sheet. */
export function isPhoneLayout(page: Page): boolean {
  return (page.viewportSize()?.width ?? 1280) < 768
}

/** The listing's "{n} Items" count, once loaded. */
export function itemsCount(page: Page) {
  return page.getByRole('main').getByText(/^\d+ Items$/)
}

/** Links to item detail pages inside the main content (cards in grid or list view). */
export function itemLinks(page: Page) {
  return page
    .getByRole('main')
    .locator(
      'a[href^="/games/"], a[href^="/dlcs/"], a[href^="/special-editions/"], a[href^="/steelbooks/"], a[href^="/artbooks/"], a[href^="/figures/"], a[href^="/stuff/"]',
    )
}
