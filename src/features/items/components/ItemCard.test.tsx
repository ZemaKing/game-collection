// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ItemCard } from '@/features/items/components/ItemCard'
import { makeItem, renderWithProviders } from '@/test/render'

describe('ItemCard', () => {
  it('grid: links to the item detail page and shows its facts', () => {
    renderWithProviders(<ItemCard item={makeItem()} platformName="PC" view="grid" />)
    expect(screen.getByRole('link', { name: 'Hades' }).getAttribute('href')).toBe('/games/item-1')
    expect(screen.getByText('Supergiant Games')).toBeTruthy()
    expect(screen.getByText('2020')).toBeTruthy()
    expect(screen.getByText('Sealed')).toBeTruthy()
  })

  it('routes each item type to its own section', () => {
    renderWithProviders(<ItemCard item={makeItem({ item_type: 'steelbook', id: 's1', title: 'SB' })} platformName={null} view="grid" />)
    expect(screen.getByRole('link', { name: 'SB' }).getAttribute('href')).toBe('/steelbooks/s1')
  })

  it('list: renders a single link row with the title', () => {
    renderWithProviders(<ItemCard item={makeItem()} platformName="PC" view="list" />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0].getAttribute('href')).toBe('/games/item-1')
    expect(screen.getAllByText('Hades').length).toBeGreaterThan(0)
  })

  it('shows the type badge only when asked', () => {
    const { unmount } = renderWithProviders(<ItemCard item={makeItem()} platformName={null} view="grid" />)
    expect(screen.queryByText('Games')).toBeNull()
    unmount()
    renderWithProviders(<ItemCard item={makeItem()} platformName={null} view="grid" showTypeBadge />)
    expect(screen.getByText('Games')).toBeTruthy()
  })

  it('hides the edit menu from visitors', () => {
    renderWithProviders(<ItemCard item={makeItem()} platformName={null} view="grid" />)
    expect(screen.queryByRole('button', { name: /more actions/i })).toBeNull()
  })

  it('offers an edit link to the signed-in owner', async () => {
    renderWithProviders(<ItemCard item={makeItem()} platformName={null} view="grid" />, { signedIn: true })
    await userEvent.click(screen.getByRole('button', { name: /more actions/i }))
    const edit = await screen.findByRole('menuitem', { name: /edit/i })
    expect(edit.getAttribute('href')).toBe('/games/item-1/edit')
  })
})
