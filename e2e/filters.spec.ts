// Filtering and the listing search box: the filter sheet, chips, Clear All, URL state, the empty
// state. Expected counts come from the oracle, never from the app.
import { expect, itemLinks, itemsCount, test } from './fixtures.ts'
import { largestPlatform, plainTitledItem } from './support/data.ts'

test('a platform filter narrows the listing, shows a chip and is in the URL', async ({
  page,
  collection,
}) => {
  const platform = largestPlatform(collection)
  await page.goto('/items')
  await expect(itemsCount(page)).toHaveText(`${collection.items.length} Items`)

  await page.getByRole('button', { name: /^Filters/ }).click()
  const sheet = page.getByRole('dialog', { name: 'Filters' })
  await sheet.getByRole('checkbox', { name: platform.name }).check()
  // Nothing applies until Apply.
  await expect(itemsCount(page)).toHaveText(`${collection.items.length} Items`)
  await sheet.getByRole('button', { name: 'Apply' }).click()
  await expect(sheet).toBeHidden()

  await expect(page).toHaveURL(new RegExp(`[?&]platform=${platform.id}`))
  await expect(itemsCount(page)).toHaveText(`${platform.count} Items`)

  // Reload keeps it (the state lives in the URL), then the chip removes it.
  await page.reload()
  await expect(itemsCount(page)).toHaveText(`${platform.count} Items`)
  await page
    .getByRole('button', { name: `Remove filter: ${platform.name}` })
    .click()
  await expect(itemsCount(page)).toHaveText(`${collection.items.length} Items`)
  await expect(page).not.toHaveURL(/platform=/)
})

test('a deep link with several facets opens filtered, and Clear All resets it', async ({
  page,
  collection,
}) => {
  const figures = collection.byType.get('figure')?.length ?? 0
  const artbooks = collection.byType.get('artbook')?.length ?? 0
  await page.goto('/items?type=figure,artbook')
  await expect(itemsCount(page)).toHaveText(`${figures + artbooks} Items`)

  await page.getByRole('button', { name: 'Clear All' }).first().click()
  await expect(itemsCount(page)).toHaveText(`${collection.items.length} Items`)
  await expect(page).not.toHaveURL(/type=/)
})

test('the listing search box filters by title and writes ?q=', async ({
  page,
  collection,
}) => {
  const item = plainTitledItem(collection)
  await page.goto('/games')
  await page
    .getByRole('searchbox', { name: 'Search games, editions, platforms...' })
    .fill(item.title)

  await expect(page).toHaveURL(
    new RegExp(
      `[?&]q=${encodeURIComponent(item.title).replace(/%20/g, '\\+')}`,
    ),
  )
  await expect(
    page.getByRole('main').getByRole('link', { name: item.title, exact: true }),
  ).toBeVisible()
  const expected = (collection.byType.get('game') ?? []).filter((g) =>
    g.title.toLowerCase().includes(item.title.toLowerCase()),
  ).length
  // The app's token match is looser than a substring (numerals, acronyms), never stricter.
  const shown = Number((await itemsCount(page).innerText()).replace(/\D/g, ''))
  expect(shown).toBeGreaterThanOrEqual(expected)
})

test('no matches shows the empty state, and Clear filters brings everything back', async ({
  page,
  collection,
}) => {
  await page.goto('/games?q=zzqxv-no-such-title')
  await expect(page.getByText('No items match these filters.')).toBeVisible()
  await expect(itemLinks(page)).toHaveCount(0)

  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(itemsCount(page)).toHaveText(
    `${collection.byType.get('game')?.length ?? 0} Items`,
  )
})

test('grid/list view switches and is remembered, but stays out of the URL', async ({
  page,
}) => {
  await page.goto('/games')
  const list = page.getByRole('button', { name: 'List view' })
  await list.click()
  await expect(list).toHaveAttribute('aria-pressed', 'true')
  await expect(page).not.toHaveURL(/view=/)

  await page.reload()
  await expect(page.getByRole('button', { name: 'List view' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})
