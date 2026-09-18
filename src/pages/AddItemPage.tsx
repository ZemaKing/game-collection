import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DuplicateWarningDialog } from '@/features/items/components/DuplicateWarningDialog'
import { ItemForm, type ItemFormSubmitResult } from '@/features/items/components/ItemForm'
import { TypeSelector } from '@/features/items/components/TypeSelector'
import { ITEM_TYPE_META, ITEM_TYPE_ROUTES, ITEM_TYPES } from '@/features/items/constants'
import { findLikelyDuplicates } from '@/features/items/duplicateApi'
import { EMPTY_ITEM_FORM_STATE } from '@/features/items/forms/formState'
import { appendItemCoverImage } from '@/features/items/imageApi'
import { useSaveItem } from '@/features/items/forms/useSaveItem'
import type { AllItemRow, ItemType } from '@/features/items/types'
import { useLocale } from '@/hooks/useLocale'

function isItemType(value: string | null): value is ItemType {
  return value !== null && (ITEM_TYPES as string[]).includes(value)
}

/** A distinct component (not a branch inside AddItemPage) so `useSaveItem` is always called unconditionally. */
function CreateItemForm({ itemType }: { itemType: ItemType }) {
  const { t } = useLocale()
  const navigate = useNavigate()
  const { save, isSaving, error, errorKind } = useSaveItem(itemType)
  const meta = ITEM_TYPE_META[itemType]
  const [checkingDuplicates, setCheckingDuplicates] = useState(false)
  const [duplicates, setDuplicates] = useState<AllItemRow[]>([])
  const [pendingSubmit, setPendingSubmit] = useState<ItemFormSubmitResult | null>(null)

  async function performSave(result: ItemFormSubmitResult) {
    const id = await save(
      null,
      result.values,
      result.relatedItems.map((item) => ({ itemType: item.itemType, itemId: item.itemId })),
    )
    if (!id) return
    let coverFailed = false
    if (result.coverImageFile) {
      try {
        await appendItemCoverImage(itemType, id, result.coverImageFile)
      } catch {
        coverFailed = true
      }
    }
    navigate(`/${ITEM_TYPE_ROUTES[itemType]}/${id}`, coverFailed ? { state: { coverUploadFailed: true } } : undefined)
  }

  async function handleSubmit(result: ItemFormSubmitResult) {
    setCheckingDuplicates(true)
    try {
      const matches = await findLikelyDuplicates(itemType, String(result.values.title ?? ''))
      if (matches.length > 0) {
        setDuplicates(matches)
        setPendingSubmit(result)
        return
      }
    } catch {
      // Duplicate check is a soft warning only; if it fails, don't block saving.
    } finally {
      setCheckingDuplicates(false)
    }
    await performSave(result)
  }

  return (
    <div className="flex min-h-full flex-col gap-6">
      <ItemForm
        itemType={itemType}
        title={
          <>
            <meta.icon size={22} className="text-muted" />
            {t('form.addTitle', { type: t(meta.labelKey) })}
          </>
        }
        initialValues={EMPTY_ITEM_FORM_STATE}
        initialRelatedItems={[]}
        isSaving={isSaving || checkingDuplicates}
        submitError={error}
        submitErrorKind={errorKind}
        submitLabel={t('form.createSubmit')}
        onSubmit={(result) => void handleSubmit(result)}
        onCancel={() => navigate('/items/new')}
      />
      <DuplicateWarningDialog
        open={duplicates.length > 0}
        itemType={itemType}
        matches={duplicates}
        onAddAnyway={() => {
          const submit = pendingSubmit
          setDuplicates([])
          setPendingSubmit(null)
          if (submit) void performSave(submit)
        }}
        onDismiss={() => {
          setDuplicates([])
          setPendingSubmit(null)
        }}
      />
    </div>
  )
}

function AddItemPage() {
  const [searchParams] = useSearchParams()
  const typeParam = searchParams.get('type')

  if (!isItemType(typeParam)) {
    return <TypeSelector />
  }

  return <CreateItemForm key={typeParam} itemType={typeParam} />
}

export default AddItemPage
