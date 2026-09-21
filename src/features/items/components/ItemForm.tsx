import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, CloseIcon } from '@/components/icons/ActionIcons'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DatePickerField } from '@/components/ui/DatePickerField'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { FormatToggle } from '@/features/items/components/FormatToggle'
import { Textarea } from '@/components/ui/Textarea'
import {
  CONDITION_LABEL_KEYS,
  DEFAULT_GENRE_META,
  GENRE_META,
  ITEM_CONDITIONS,
} from '@/features/items/constants'
import { ConditionSelect } from '@/features/items/components/ConditionSelect'
import { CompletionToggle } from '@/features/items/components/CompletionToggle'
import { DlcTypeToggle } from '@/features/items/components/DlcTypeToggle'
import { EditionSelect } from '@/features/items/components/EditionSelect'
import { GameSelect } from '@/features/items/components/GameSelect'
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
import type { ErrorKind } from '@/lib/errorHelpers'

function sortedIds(items: RelatedItemSelection[]): string[] {
  return [...items.map((item) => item.itemId)].sort()
}

export interface ItemFormSubmitResult {
  values: Record<string, unknown> & { tagIds: string[]; genreIds?: string[] }
  relatedItems: RelatedItemSelection[]
  /** Only present for special editions — the games this edition is the special edition of. */
  baseGames?: RelatedItemSelection[]
  coverImageFile?: File
}

interface ItemFormProps {
  itemType: ItemType
  title: ReactNode
  initialValues: ItemFormState
  initialRelatedItems: RelatedItemSelection[]
  /** Special editions only: the games already linked as this edition's base game. */
  initialBaseGames?: RelatedItemSelection[]
  /** The item being edited, excluded from its own relationship search results. Also gates the Images step: `item_images` rows need a real item id, which doesn't exist yet during create. */
  excludeId?: string
  isSaving: boolean
  submitError: string | null
  submitErrorKind?: ErrorKind | null
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
  title,
  initialValues,
  initialRelatedItems,
  initialBaseGames = [],
  excludeId,
  isSaving,
  submitError,
  submitErrorKind = null,
  submitLabel,
  onSubmit,
  onCancel,
}: ItemFormProps) {
  const { t } = useLocale()
  const location = useLocation()
  const isMobile = useIsMobile()
  const { platforms, genres, tags } = useItemLookups()
  const [form, setForm] = useState<ItemFormState>(initialValues)
  const [relatedItems, setRelatedItems] = useState<RelatedItemSelection[]>(initialRelatedItems)
  const [baseGames, setBaseGames] = useState<RelatedItemSelection[]>(initialBaseGames)
  const isSpecialEdition = itemType === 'special_edition'
  // Steelbooks are always physical: the tag is fixed, shown read-only, and forced on save.
  const isSteelbook = itemType === 'steelbook'
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [stepIndex, setStepIndex] = useState(0)
  const [pendingCoverFile, setPendingCoverFile] = useState<File | undefined>(undefined)

  const isDirty = useMemo(
    () =>
      JSON.stringify(form) !== JSON.stringify(initialValues) ||
      JSON.stringify(sortedIds(relatedItems)) !== JSON.stringify(sortedIds(initialRelatedItems)) ||
      JSON.stringify(sortedIds(baseGames)) !== JSON.stringify(sortedIds(initialBaseGames)) ||
      pendingCoverFile !== undefined,
    [form, initialValues, relatedItems, initialRelatedItems, baseGames, initialBaseGames, pendingCoverFile],
  )
  const { isBlocked, guardAction, confirmDiscard, cancelDiscard } = useUnsavedChangesGuard(isDirty)

  function setField<K extends keyof ItemFormState>(name: K, value: ItemFormState[K]) {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function renderField(field: FormFieldDef) {
    if (field.kind === 'completedToggle') {
      return (
        <div key={field.name} className="sm:col-span-2">
          <CompletionToggle
            label={t(field.labelKey)}
            name={field.name}
            value={form.completed}
            onChange={(next) => setField('completed', next)}
          />
        </div>
      )
    }
    const value = form[field.name]
    const errorKey = errors[field.name]
    const error = errorKey ? t(errorKey as TranslationKey) : undefined
    const label = t(field.labelKey)

    if (field.kind === 'gameSelect') {
      return (
        <GameSelect
          key={field.name}
          label={label}
          name={field.name}
          value={form.game_id}
          onChange={(next) => setField('game_id', next)}
          error={error}
          required={field.required}
        />
      )
    }
    if (field.kind === 'dlcTypeToggle') {
      return (
        <div key={field.name} className="sm:col-span-2">
          <DlcTypeToggle
            label={label}
            name={field.name}
            value={form.dlc_type}
            onChange={(next) => setField('dlc_type', next)}
          />
        </div>
      )
    }
    if (field.kind === 'textarea') {
      return (
        <div key={field.name} className="sm:col-span-2">
          <Textarea
            label={label}
            name={field.name}
            value={value as string}
            onChange={(e) => setField(field.name, e.target.value as never)}
            error={error}
            rows={field.rows}
          />
        </div>
      )
    }
    if (field.kind === 'date') {
      return (
        <DatePickerField
          key={field.name}
          label={label}
          name={field.name}
          value={value as string}
          onChange={(next) => setField(field.name, next as never)}
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
    if (field.kind === 'editionSelect') {
      return (
        <EditionSelect
          key={field.name}
          label={label}
          name={field.name}
          value={value as string}
          onChange={(v) => setField(field.name, v as never)}
          error={error}
        />
      )
    }
    if (field.kind === 'conditionSelect') {
      return (
        <ConditionSelect
          key={field.name}
          label={label}
          name={field.name}
          value={value as string}
          onChange={(v) => setField(field.name, v as never)}
          options={ITEM_CONDITIONS}
          labelKeys={CONDITION_LABEL_KEYS}
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
          <FormatToggle
            label={t('filters.tags')}
            name="tagIds"
            values={form.tagIds}
            onChange={(values) => setField('tagIds', values)}
            options={tags}
            lockedSlug={isSteelbook ? 'physical' : undefined}
          />
          {showGenres && (
            <MultiSelect
              label={t('filters.genre')}
              name="genreIds"
              values={form.genreIds}
              onChange={(values) => setField('genreIds', values)}
              options={genres}
              emptyLabel={t('form.noOptionsYet')}
              optionMeta={(genre) => {
                const meta = GENRE_META[genre.slug] ?? DEFAULT_GENRE_META
                return { icon: meta.icon, colorClass: meta.color.icon }
              }}
              primary
            />
          )}
          {isSpecialEdition && (
            <RelationshipPicker
              label={t('detail.baseGame')}
              selected={baseGames}
              onChange={setBaseGames}
              excludeId={excludeId}
              excludeIds={relatedItems.map((item) => item.itemId)}
              allowedTypes={['game']}
            />
          )}
          <RelationshipPicker
            label={t(isSpecialEdition ? 'detail.contents' : 'form.sectionRelationships')}
            selected={relatedItems}
            onChange={setRelatedItems}
            excludeId={excludeId}
            excludeIds={baseGames.map((item) => item.itemId)}
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
    const values = result.data as ItemFormSubmitResult['values']
    if (isSteelbook) {
      const physicalTag = tags.find((tag) => tag.slug === 'physical')
      if (physicalTag) values.tagIds = [physicalTag.id]
    }
    onSubmit({
      values,
      relatedItems,
      baseGames: isSpecialEdition ? baseGames : undefined,
      coverImageFile: pendingCoverFile,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-full flex-1 flex-col gap-6">
      {isMobile ? (
        <h1 className="flex items-center gap-2 text-xl font-bold text-text">{title}</h1>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-xl font-bold text-text">{title}</h1>
          <div className="flex items-center gap-3">
            <Button icon={CloseIcon} onClick={() => guardAction(onCancel)}>
              {t('filters.cancel')}
            </Button>
            <Button type="submit" variant="primary" icon={CheckIcon} disabled={isSaving}>
              {isSaving ? t('form.saving') : submitLabel}
            </Button>
          </div>
        </div>
      )}

      {submitError && submitErrorKind === 'auth' && (
        <ErrorState
          message={t('common.sessionExpired')}
          secondaryAction={
            <Link to="/login" state={{ from: location }} className="font-semibold hover:underline">
              {t('common.signInAgain')}
            </Link>
          }
        />
      )}
      {submitError && submitErrorKind === 'network' && <ErrorState message={t('common.networkError')} />}
      {submitError && (submitErrorKind === 'unknown' || submitErrorKind === null) && (
        <ErrorState message={submitError} />
      )}

      {Object.keys(errors).length > 0 && (
        <p role="alert" className="rounded-lg border border-danger bg-danger-bg px-4 py-3 text-sm text-danger">
          {t('form.hasErrors')}
        </p>
      )}

      {isMobile ? (
        <section className="flex flex-col gap-4 pb-20">
          <p role="status" className="sr-only">
            {t('a11y.stepStatus', { current: String(stepIndex + 1), total: String(steps.length), title: t(steps[stepIndex].titleKey) })}
          </p>
          <div aria-hidden="true" className="flex items-center gap-1.5">
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

      {isMobile && (
        <div className="sticky inset-x-0 bottom-0 z-10 -mx-4 mt-auto flex items-center justify-between gap-3 border-t border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            icon={stepIndex === 0 ? CloseIcon : ArrowLeftIcon}
            onClick={() => (stepIndex === 0 ? guardAction(onCancel) : setStepIndex((i) => i - 1))}
          >
            {stepIndex === 0 ? t('filters.cancel') : t('form.back')}
          </Button>
          {isLastStep ? (
            <Button key="submit" type="submit" variant="primary" icon={CheckIcon} disabled={isSaving}>
              {isSaving ? t('form.saving') : submitLabel}
            </Button>
          ) : (
            <Button key="next" variant="primary" icon={ArrowRightIcon} onClick={() => setStepIndex((i) => i + 1)}>
              {t('form.next')}
            </Button>
          )}
        </div>
      )}

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
