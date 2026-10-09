// Settings: theme, language and default view apply at once and survive a reload (local only).
import { expect, test } from './fixtures.ts'

test('the theme switches and is remembered', async ({ page }) => {
  await page.goto('/settings')
  const theme = page.getByRole('radiogroup', { name: 'Theme' })

  await theme.getByRole('radio', { name: 'Light' }).click()
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
  await theme.getByRole('radio', { name: 'Dark' }).click()
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)

  await page.reload()
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  await expect(
    page
      .getByRole('radiogroup', { name: 'Theme' })
      .getByRole('radio', { name: 'Dark' }),
  ).toHaveAttribute('aria-checked', 'true')
})

test('the language switches the whole UI and is remembered', async ({
  page,
}) => {
  await page.goto('/settings')
  await page
    .getByRole('radiogroup', { name: 'Language' })
    .getByRole('radio', { name: 'Srpski' })
    .click()

  await expect(
    page.getByRole('heading', { level: 1, name: 'Podešavanja' }),
  ).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'sr')

  await page.reload()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Podešavanja' }),
  ).toBeVisible()
})

test('the default view applies to listings without their own choice', async ({
  page,
}) => {
  await page.goto('/settings')
  await page
    .getByRole('radiogroup', { name: 'Default view' })
    .getByRole('radio', { name: 'List' })
    .click()

  await page.goto('/figures')
  await expect(page.getByRole('button', { name: 'List view' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})
