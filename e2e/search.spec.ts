// Global search: the Ctrl K dialog from the top bar (tablet/desktop), the /search page (phones).
import { expect, isPhoneLayout, test } from './fixtures.ts'
import { plainTitledItem, TYPE_ROUTES } from './support/data.ts'

test('search finds an item by title and opens it', async ({
  page,
  collection,
}) => {
  const item = plainTitledItem(collection)
  await page.goto('/')

  if (isPhoneLayout(page)) {
    await page.getByRole('link', { name: 'Search', exact: true }).click()
    await expect(page).toHaveURL(/\/search$/)
  } else {
    await page
      .getByRole('button', { name: /Search games, editions, platforms/ })
      .click()
    await expect(
      page.getByRole('dialog', { name: 'Search the collection' }),
    ).toBeVisible()
  }

  await page
    .getByRole('combobox', { name: 'Search the collection' })
    .fill(item.title)
  await page
    .getByRole('option', { name: new RegExp(item.title) })
    .first()
    .click()

  await expect(page).toHaveURL(
    new RegExp(`/${TYPE_ROUTES[item.item_type]}/${item.id}$`),
  )
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    item.title,
  )
})

test('Ctrl K opens the search dialog and Escape closes it', async ({
  page,
}) => {
  test.skip(isPhoneLayout(page), 'phones have no keyboard shortcut')
  await page.goto('/games')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.keyboard.press('Control+k')
  const dialog = page.getByRole('dialog', { name: 'Search the collection' })
  await expect(dialog).toBeVisible()
  await expect(
    page.getByRole('combobox', { name: 'Search the collection' }),
  ).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('a search with no results says so', async ({ page }) => {
  await page.goto('/search')
  await page
    .getByRole('combobox', { name: 'Search the collection' })
    .fill('zzqxv no such thing')
  const message = 'No results for "zzqxv no such thing".'
  // Shown on screen, and announced through the (visually hidden) status region.
  await expect(
    page.getByText(message).and(page.locator(':not([role="status"])')),
  ).toBeVisible()
  await expect(
    page.getByRole('status').filter({ hasText: message }),
  ).toHaveCount(1)
})
