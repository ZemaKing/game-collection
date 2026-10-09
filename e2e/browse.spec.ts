// Browsing: dashboard, every type's listing, paging, platform pages, navigation per layout,
// unknown routes. Runs on desktop, tablet and mobile.
import {
  expect,
  isPhoneLayout,
  itemLinks,
  itemsCount,
  test,
} from './fixtures.ts'
import { largestPlatform, TYPE_ROUTES, type ItemType } from './support/data.ts'

test('the dashboard loads with its hero and the newest items', async ({
  page,
}) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Your Gaming Universe' }),
  ).toBeVisible()
  await expect(page).toHaveTitle(/Your Gaming Universe/)
  await expect(itemLinks(page).first()).toBeVisible()
  // The hero is a responsive WebP, not the old 2.3 MB PNG (Phase 38).
  await expect(page.locator('img[src*="dashboard_cover-"]')).toHaveAttribute(
    'srcset',
    /\.webp 1200w/,
  )
})

test('every item type lists exactly the items the database has', async ({
  page,
  collection,
}) => {
  for (const [type, route] of Object.entries(TYPE_ROUTES) as [
    ItemType,
    string,
  ][]) {
    await page.goto(`/${route}`)
    await expect(itemsCount(page), route).toHaveText(
      `${collection.byType.get(type)?.length ?? 0} Items`,
    )
  }
  await page.goto('/items')
  await expect(itemsCount(page)).toHaveText(`${collection.items.length} Items`)
})

test('the next page loads: Load More, or scrolling on touch screens', async ({
  page,
  collection,
}) => {
  test.skip(collection.items.length <= 20, 'needs more than one page')
  await page.goto('/items')
  await expect(itemLinks(page)).toHaveCount(20)
  // SCROLL_LOADING_QUERY in src/hooks/useLoadMoreOnScroll.ts.
  const scrollLoading = await page.evaluate(
    () => matchMedia('(max-width: 1023px), (pointer: coarse)').matches,
  )
  if (scrollLoading) {
    await expect(page.getByRole('button', { name: 'Load More' })).toHaveCount(0)
    await itemLinks(page).last().scrollIntoViewIfNeeded()
  } else {
    await page.getByRole('button', { name: 'Load More' }).click()
  }
  await expect(itemLinks(page)).toHaveCount(
    Math.min(40, collection.items.length),
  )
})

test('a platform page lists that platform’s items', async ({
  page,
  collection,
}) => {
  const platform = largestPlatform(collection)
  await page.goto(`/platforms/${platform.slug}`)
  await expect(
    page.getByRole('heading', { level: 1, name: platform.name }),
  ).toBeVisible()
  await expect(itemsCount(page)).toHaveText(`${platform.count} Items`)
})

test('the navigation reaches a listing in this layout', async ({ page }) => {
  await page.goto('/')
  if (isPhoneLayout(page)) {
    // Phones: the bottom tab bar, and the menu sheet for everything else.
    await page
      .getByRole('navigation', { name: 'Quick navigation' })
      .getByRole('link', { name: 'Games' })
      .click()
    await expect(page).toHaveURL(/\/games$/)
    await page.getByRole('button', { name: 'Menu' }).click()
    await page
      .getByRole('dialog')
      .getByRole('link', { name: 'Steelbooks' })
      .click()
    await expect(page.getByRole('dialog')).toBeHidden()
  } else {
    await expect(
      page.getByRole('navigation', { name: 'Quick navigation' }),
    ).toBeHidden()
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Steelbooks' })
      .click()
  }
  await expect(page).toHaveURL(/\/steelbooks$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Steelbooks' }),
  ).toBeVisible()
})

test('a card opens its detail page', async ({ page }) => {
  await page.goto('/games')
  const first = itemLinks(page).first()
  const title =
    (await first.getAttribute('aria-label')) ?? (await first.innerText())
  await first.click()
  await expect(page).toHaveURL(/\/games\/[0-9a-f-]{36}$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    title.split('\n')[0].trim(),
  )
})

test('an unknown item id shows “Item not found”', async ({ page }) => {
  await page.goto('/games/00000000-0000-0000-0000-000000000000')
  await expect(page.getByText('Item not found')).toBeVisible()
  await page.getByRole('link', { name: 'Back to Games' }).click()
  await expect(page).toHaveURL(/\/games$/)
})

test('no page scrolls sideways', async ({ page }) => {
  for (const path of ['/', '/items', '/games', '/statistics', '/settings']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // The page and <main> (AppShell's scroll container) both have to fit.
    const overflow = await page.evaluate(() =>
      Math.max(
        ...[document.documentElement, document.querySelector('main')!].map(
          (el) => el.scrollWidth - el.clientWidth,
        ),
      ),
    )
    expect(overflow, `${path} overflows horizontally`).toBeLessThanOrEqual(0)
  }
})
