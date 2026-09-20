// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FilterSheet } from '@/features/items/components/FilterSheet'
import { DEFAULT_FILTERS } from '@/features/items/useFilters'
import { renderWithProviders } from '@/test/render'

function setup(filters = DEFAULT_FILTERS) {
  const onApply = vi.fn()
  const onOpenChange = vi.fn()
  renderWithProviders(
    <FilterSheet
      open
      onOpenChange={onOpenChange}
      filters={filters}
      onApply={onApply}
      showTypeFilter
      showPlatformFilter
      showGenreFilter={false}
      showEditionFilter={false}
      platforms={[{ id: 'p1', name: 'PlayStation 5', slug: 'ps5' }]}
      genres={[]}
      tags={[]}
      years={[2020, 2021]}
      editions={[]}
    />,
  )
  return { onApply, onOpenChange }
}

describe('FilterSheet', () => {
  it('applies nothing until Apply is pressed, then closes', async () => {
    const { onApply, onOpenChange } = setup()
    await userEvent.click(screen.getByRole('checkbox', { name: 'PlayStation 5' }))
    expect(onApply).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(onApply).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, platformIds: ['p1'] })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('toggles a value off again', async () => {
    const { onApply } = setup({ ...DEFAULT_FILTERS, platformIds: ['p1'] })
    const box = screen.getByRole('checkbox', { name: 'PlayStation 5' }) as HTMLInputElement
    expect(box.checked).toBe(true)
    await userEvent.click(box)
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ platformIds: [] }))
  })

  it('Clear All resets the draft', async () => {
    const { onApply } = setup({ ...DEFAULT_FILTERS, platformIds: ['p1'], years: [2020] })
    await userEvent.click(screen.getByRole('button', { name: 'Clear All' }))
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ platformIds: [], years: [] }))
  })

  it('hides sections that are switched off', () => {
    setup()
    expect(screen.queryByText('Genre')).toBeNull()
    expect(screen.queryByText('Edition')).toBeNull()
  })
})
