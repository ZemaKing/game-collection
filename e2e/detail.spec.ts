// The detail page and the media viewer: gallery, open, page through, close, focus return.
import { expect, isPhoneLayout, test } from './fixtures.ts'
import { gameWithImages } from './support/data.ts'

test('the detail page shows the item and its gallery', async ({
  page,
  collection,
}) => {
  const game = gameWithImages(collection)
  test.skip(!game, 'needs a game with at least two images')
  const total = collection.imageCounts.get(game!.id)!

  await page.goto(`/games/${game!.id}`)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    game!.title,
  )
  await expect(page).toHaveTitle(
    new RegExp(game!.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  )
  await expect(page.getByRole('heading', { name: 'Gallery' })).toBeVisible()
  await expect(
    page.getByRole('button', { name: `Show image ${total} of ${total}` }),
  ).toBeVisible()
  // Signed out: no owner actions.
  await expect(page.locator('a[href$="/edit"]')).toHaveCount(0)
})

test('the viewer pages through the images and returns focus on close', async ({
  page,
  collection,
}) => {
  const game = gameWithImages(collection)
  test.skip(!game, 'needs a game with at least two images')
  const total = collection.imageCounts.get(game!.id)!

  await page.goto(`/games/${game!.id}`)
  const trigger = page
    .getByRole('main')
    .getByRole('button', { name: `Show image 1 of ${total}` })
    .first()
  await trigger.click()

  const viewer = page.getByRole('dialog', { name: game!.title })
  await expect(viewer).toBeVisible()
  await expect(viewer.getByText(`1 / ${total}`)).toBeVisible()

  if (isPhoneLayout(page)) {
    // Phones page with the on-screen arrows (swipes are covered by the component test).
    await viewer.getByRole('button', { name: 'Next image' }).tap()
  } else {
    await page.keyboard.press('ArrowRight')
  }
  await expect(viewer.getByText(`2 / ${total}`)).toBeVisible()
  await viewer.getByRole('button', { name: 'Previous image' }).click()
  await expect(viewer.getByText(`1 / ${total}`)).toBeVisible()

  await viewer
    .getByRole('button', { name: `Show image ${total} of ${total}` })
    .click()
  await expect(viewer.getByText(`${total} / ${total}`)).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(viewer).toBeHidden()
  await expect(trigger).toBeFocused()
})
