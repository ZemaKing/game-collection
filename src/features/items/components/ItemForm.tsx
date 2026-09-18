import { useMemo, useState, type FormEvent } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { CONDITION_LABEL_KEYS, ITEM_CONDITIONS } from '@/features/items/constants'
import { GameAutofillPanel } from '@/features/items/components/GameAutofillPanel'
import { ImageManager } from '@/features/items/components/ImageManager'
import { PlatformSelect } from '@/features/items/components/PlatformSelect'
import { RelationshipPicker, type RelatedItemSelection } from '@/features/items/components/RelationshipPicker'
import { FORM_SECTIONS, type FormFieldDef } from '@/features/items/forms/formFields'
import type { ItemFormState } from '@/features/items/forms/formState'
import { ITEM_SCHEMAS } from '@/features/items/forms/schemas'
import { useItemLookups } from '@/features/items/forms/useItemLookups'
import type { ItemType } from '@/features/items/types'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useLocale } from '@/hooks/useLocale'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import type { TranslationKey } from '@/lib/i18n'

function sortedIds(items: RelatedItemSelection[]): string[] {
  return [...items.map((item) => item.itemId)].sort()
}

export interface ItemFormSubmitResult {
  values: Record<string, unknown> & { tagIds: string[]; genreIds?: string[] }
  relatedItems: RelatedItemSelection[]
  coverImageFile?: File
}

interface ItemFormProps {
  itemType: ItemType
  initialValues: ItemFormState
  initialRelatedItems: RelatedItemSelection[]
  /** The item being edited, excluded from its own relationship search results. Also gates the Images step: `item_images` rows need a real item id, which doesn't exist yet during create. */
  excludeId?: string
  isSaving: boolean
  submitError: string | null
  submitLabel: string
  onSubmit: (result: ItemFormSubmitResult) => void
  onCancel: () => void
}

function fieldErrorPath(path: PropertyKey[]): string {
  return path.map(String).join('.')
}

/**
 * Shared create/edit form for all six item types, driven by `FORM_SECTIONS`
 * (the write-side counterpart to `detailFields.ts`). One `useState` + zod
 * `safeParse` on submit — same hand-rolled pattern as
 * `recipe-collection/src/components/admin/RecipeForm.tsx` — so no data is
 * ever lost switching steps: mobile just renders one section at a time from
 * the same state, desktop/tablet render them all in one scroll.
 */
export function ItemForm({
  itemType,
  initialValues,
  initialRelatedItems,
  excludeId,
  isSaving,
  submitError,
  submitLabel,
  onSubmit,
  onCancel,
}: ItemFormProps) {
  const { t } = useLocale()
  const isMobile = useIsMobile()
  const { platforms, genres, tags } = useItemLookups()
  const [form, setForm] = useState<ItemFormState>(initialValues)
  const [relatedItems, setRelatedItems] = useState<RelatedItemSelection[]>(initialRelatedItems)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [stepIndex, setStepIndex] = useState(0)
  const [pendingCoverFile, setPendingCoverFile] = useState<File | undefined>(undefined)

  const isDirty = useMemo(
    () =>
      JSON.stringify(form) !== JSON.stringify(initialValues) ||
      JSON.stringify(sortedIds(relatedItems)) !== JSON.stringify(sortedIds(initialRelatedItems)) ||
      pendingCoverFile !== undefined,
    [form, initialValues, relatedItems, initialRelatedItems, pendingCoverFile],
  )
  const { isBlocked, guardAction, confirmDiscard, cancelDiscard } = useUnsavedChangesGuard(isDirty)

  function setField<K extends keyof ItemFormState>(name: K, value: ItemFormState[K]) {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function renderField(field: FormFieldDef) {
    const value = form[field.name]
    const errorKey = errors[field.name]
    const error = errorKey ? t(errorKey as TranslationKey) : undefined
    const label = t(field.labelKey)

    if (field.kind === 'textarea') {
      return (
        <div key={field.name} className="sm:col-span-2">
          <Textarea
            label={label}
            name={field.name}
            value={value as string}
            onChange={(e) => setField(field.name, e.target.value as never)}
            error={error}
          />
        </div>
      )
    }
    if (field.kind === 'date') {
      return (
        <Input
          key={field.name}
          type="date"
          label={label}
          name={field.name}
          value={value as string}
          onChange={(e) => setField(field.name, e.target.value as never)}
          error={error}
        />
      )
    }
    if (field.kind === 'number') {
      return (
        <Input
          key={field.name}
          type="number"
          inputMode="decimal"
          label={label}
          name={field.name}
          value={value as string}
          onChange={(e) => setField(field.name, e.target.value as never)}
          error={error}
        />
      )
    }
    if (field.kind === 'platformSelect') {
      return (
        <PlatformSelect
          key={field.name}
          label={label}
          name={field.name}
          value={value as string}
          onChange={(v) => setField(field.name, v as never)}
          options={platforms}
          error={error}
        />
      )
    }
    if (field.kind === 'conditionSelect') {
      return (
        <Select
          key={field.name}
          label={label}
          name={field.name}
          value={value as string}
          onChange={(v) => setField(field.name, v as never)}
          options={ITEM_CONDITIONS.map((condition) => ({
            value: condition,
            label: t(CONDITION_LABEL_KEYS[condition]),
          }))}
          error={error}
        />
      )
    }
    return (
      <Input
        key={field.name}
        label={label}
        name={field.name}
        required={field.required}
        value={value as string}
        onChange={(e) => setField(field.name, e.target.value as never)}
        error={error}
      />
    )
  }

  const showGenres = itemType === 'game'
  const perTypeSections = FORM_SECTIONS[itemType]

  const steps = [
    ...perTypeSections.map((section, index) => ({
      titleKey: section.titleKey,
      render: () => (
        <div className="flex flex-col gap-4">
          {itemType === 'game' && index === 0 && (
            <GameAutofillPanel
              form={form}
              genres={genres}
              platforms={platforms}
              onApply={(values, coverImageFile) => {
                setForm((prev) => ({ ...prev, ...values }))
                if (coverImageFile) setPendingCoverFile(coverImageFile)
              }}
            />
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{section.fields.map(renderField)}</div>
        </div>
      ),
    })),
    {
      titleKey: 'form.sectionTagsAndLinks' as TranslationKey,
      render: () => (
        <div className="flex flex-col gap-4">
          <MultiSelect
            label={t('filters.tags')}
            name="tagIds"
            values={form.tagIds}
            onChange={(values) => setField('tagIds', values)}
            options={tags}
            emptyLabel={t('form.noOptionsYet')}
          />
          {showGenres && (
            <MultiSelect
              label={t('filters.genre')}
              name="genreIds"
              values={form.genreIds}
              onChange={(values) => setField('genreIds', values)}
              options={genres}
              emptyLabel={t('form.noOptionsYet')}
            />
          )}
          <RelationshipPicker
            label={t('form.sectionRelationships')}
            selected={relatedItems}
            onChange={setRelatedItems}
            excludeId={excludeId}
          />
        </div>
      ),
    },
    ...(excludeId
      ? [
          {
            titleKey: 'images.sectionTitle' as TranslationKey,
            render: () => <ImageManager itemType={itemType} itemId={excludeId} />,
          },
        ]
      : []),
  ]
  const isLastStep = stepIndex === steps.length - 1

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const schema = ITEM_SCHEMAS[itemType]
    const result = schema.safeParse(form)

    if (!result.success) {
      const nextErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        nextErrors[fieldErrorPath(issue.path)] = issue.message
      }
      setErrors(nextErrors)

      const firstField = Object.keys(nextErrors)[0]
      const stepWithError = perTypeSections.findIndex((section) =>
        section.fields.some((field) => field.name === firstField),
      )
      if (stepWithError >= 0) setStepIndex(stepWithError)
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>(`[data-field="${firstField}"]`)?.focus()
      })
      return
    }

    setErrors({})
    onSubmit({ values: result.data as ItemFormSubmitResult['values'], relatedItems, coverImageFile: pendingCoverFile })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-20">
      {submitError && (
        <p className="rounded-lg border border-danger bg-danger-bg px-4 py-3 text-sm text-danger">
          {submitError}
        </p>
      )}

      {Object.keys(errors).length > 0 && (
        <p className="rounded-lg border border-danger bg-danger-bg px-4 py-3 text-sm text-danger">
          {t('form.hasErrors')}
        </p>
      )}

      {isMobile ? (
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-1.5">
            {steps.map((step, i) => (
              <span
                key={step.titleKey}
                className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? 'bg-accent' : 'bg-border'}`}
              />
            ))}
          </div>
          <h2 className="heading-section text-text">{t(steps[stepIndex].titleKey)}</h2>
          {steps[stepIndex].render()}
        </section>
      ) : (
        <div className="flex flex-col gap-8">
          {steps.map((step) => (
            <section key={step.titleKey} className="flex flex-col gap-4">
              <h2 className="heading-section text-text">{t(step.titleKey)}</h2>
              {step.render()}
            </section>
          ))}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-between gap-3 border-t border-border bg-card p-4 md:sticky md:rounded-b-xl">
        {isMobile ? (
          <>
            <button
              type="button"
              onClick={() => (stepIndex === 0 ? guardAction(onCancel) : setStepIndex((i) => i - 1))}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-text hover:bg-card-hover"
            >
              {stepIndex === 0 ? t('filters.cancel') : t('form.back')}
            </button>
            {isLastStep ? (
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-fg hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? t('form.saving') : submitLabel}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStepIndex((i) => i + 1)}
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-fg hover:bg-accent-hover"
              >
                {t('form.next')}
              </button>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => guardAction(onCancel)}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-text hover:bg-card-hover"
            >
              {t('filters.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-fg hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? t('form.saving') : submitLabel}
            </button>
          </>
        )}
      </div>

      <ConfirmDialog
        open={isBlocked}
        onOpenChange={(open) => !open && cancelDiscard()}
        title={t('form.unsavedChangesTitle')}
        description={t('form.unsavedChangesBody')}
        confirmLabel={t('form.discardChanges')}
        cancelLabel={t('form.keepEditing')}
        onConfirm={confirmDiscard}
      />
    </form>
  )
}
