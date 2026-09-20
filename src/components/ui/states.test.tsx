// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { CompletenessBadge } from '@/features/items/components/CompletenessBadge'
import { SortMenu } from '@/features/items/components/SortMenu'
import { renderWithProviders } from '@/test/render'

describe('EmptyState', () => {
  it('shows title, body and action', () => {
    renderWithProviders(<EmptyState title="Nothing here" body="Add your first item" action={<button>Add</button>} />)
    expect(screen.getByRole('heading', { name: 'Nothing here' })).toBeTruthy()
    expect(screen.getByText('Add your first item')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Add' })).toBeTruthy()
  })
})

describe('ErrorState', () => {
  it('announces the message and retries on click', async () => {
    const onRetry = vi.fn()
    renderWithProviders(<ErrorState message="Load failed" onRetry={onRetry} />)
    expect(screen.getByRole('alert').textContent).toContain('Load failed')
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('has no retry button without a handler', () => {
    renderWithProviders(<ErrorState message="Load failed" />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})

describe('CompletenessBadge', () => {
  it('exposes the percentage to screen readers', () => {
    renderWithProviders(<CompletenessBadge percent={72} />)
    expect(screen.getAllByText(/72/).length).toBeGreaterThan(0)
  })
})

describe('ConfirmDialog', () => {
  function setup() {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    renderWithProviders(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="Delete Hades?"
        description="This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={onConfirm}
      />,
    )
    return { onConfirm, onOpenChange }
  }

  it('confirms and closes', async () => {
    const { onConfirm, onOpenChange } = setup()
    expect(screen.getByRole('dialog', { name: 'Delete Hades?' })).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('cancels without confirming', async () => {
    const { onConfirm, onOpenChange } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('closes on Escape', async () => {
    const { onConfirm, onOpenChange } = setup()
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onConfirm).not.toHaveBeenCalled()
  })
})

describe('SortMenu', () => {
  it('shows the current sort and reports a new choice', async () => {
    const onChange = vi.fn()
    renderWithProviders(<SortMenu value="title" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /title/i }))
    await userEvent.click(await screen.findByRole('menuitem', { name: /release date/i }))
    expect(onChange).toHaveBeenCalledWith('release_date')
  })
})
