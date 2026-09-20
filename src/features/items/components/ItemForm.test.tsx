// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ItemForm } from '@/features/items/components/ItemForm'
import { EMPTY_ITEM_FORM_STATE } from '@/features/items/forms/formState'
import { renderWithProviders } from '@/test/render'

// The form's lookups, autofill, relationship search and image manager all hit Supabase/RAWG.
vi.mock('@/features/items/forms/useItemLookups', () => ({
  useItemLookups: () => ({ platforms: [], genres: [], tags: [], loading: false }),
}))
vi.mock('@/features/items/components/RelationshipPicker', () => ({ RelationshipPicker: () => null }))
vi.mock('@/features/items/components/GameAutofillPanel', () => ({ GameAutofillPanel: () => null }))
vi.mock('@/features/items/components/ImageManager', () => ({ ImageManager: () => null }))

function setup(overrides: Partial<Parameters<typeof ItemForm>[0]> = {}) {
  const onSubmit = vi.fn()
  const onCancel = vi.fn()
  renderWithProviders(
    <ItemForm
      itemType="game"
      title="Add game"
      initialValues={EMPTY_ITEM_FORM_STATE}
      initialRelatedItems={[]}
      isSaving={false}
      submitError={null}
      submitLabel="Save item"
      onSubmit={onSubmit}
      onCancel={onCancel}
      {...overrides}
    />,
    { signedIn: true },
  )
  return { onSubmit, onCancel }
}

const titleInput = () => screen.getByRole('textbox', { name: /^title/i })
const saveButton = () => screen.getAllByRole('button', { name: 'Save item' })[0]

describe('ItemForm', () => {
  it('blocks submit and shows an error when the title is empty', async () => {
    const { onSubmit } = setup()
    await userEvent.click(saveButton())
    expect(onSubmit).not.toHaveBeenCalled()
    expect((await screen.findAllByText('Title is required.')).length).toBeGreaterThan(0)
  })

  it('submits parsed, trimmed values', async () => {
    const { onSubmit } = setup()
    await userEvent.type(titleInput(), '  Hades  ')
    await userEvent.click(saveButton())
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0].values.title).toBe('Hades')
  })

  it('cancels straight away when nothing changed', async () => {
    const { onCancel } = setup()
    await userEvent.click(screen.getAllByRole('button', { name: /cancel/i })[0])
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('asks before discarding unsaved changes', async () => {
    const { onCancel } = setup()
    await userEvent.type(titleInput(), 'Hades')
    await userEvent.click(screen.getAllByRole('button', { name: /cancel/i })[0])
    expect(onCancel).not.toHaveBeenCalled()
    expect(await screen.findByRole('dialog', { name: 'Discard changes?' })).toBeTruthy()

    await userEvent.click(screen.getByRole('button', { name: 'Discard Changes' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('keeps editing when the discard prompt is dismissed', async () => {
    const { onCancel } = setup()
    await userEvent.type(titleInput(), 'Hades')
    await userEvent.click(screen.getAllByRole('button', { name: /cancel/i })[0])
    await userEvent.click(await screen.findByRole('button', { name: /keep editing/i }))
    expect(onCancel).not.toHaveBeenCalled()
    expect((titleInput() as HTMLInputElement).value).toBe('Hades')
  })

  it('shows the save error passed in', () => {
    setup({ submitError: 'Could not save' })
    expect(screen.getByRole('alert').textContent).toContain('Could not save')
  })
})
