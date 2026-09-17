import { useNavigate, useSearchParams } from 'react-router-dom'
import { ItemForm, type ItemFormSubmitResult } from '@/features/items/components/ItemForm'
import { TypeSelector } from '@/features/items/components/TypeSelector'
import { ITEM_TYPE_META, ITEM_TYPE_ROUTES, ITEM_TYPES } from '@/features/items/constants'
import { EMPTY_ITEM_FORM_STATE } from '@/features/items/forms/formState'
import { useSaveItem } from '@/features/items/forms/useSaveItem'
import type { ItemType } from '@/features/items/types'
import { useLocale } from '@/hooks/useLocale'

function isItemType(value: string | null): value is ItemType {
  return value !== null && (ITEM_TYPES as string[]).includes(value)
}

/** A distinct component (not a branch inside AddItemPage) so `useSaveItem` is always called unconditionally. */
function CreateItemForm({ itemType }: { itemType: ItemType }) {
  const { t } = useLocale()
  const navigate = useNavigate()
  const { save, isSaving, error } = useSaveItem(itemType)
  const meta = ITEM_TYPE_META[itemType]

  async function handleSubmit(result: ItemFormSubmitResult) {
    const id = await save(
      null,
      result.values,
      result.relatedItems.map((item) => ({ itemType: item.itemType, itemId: item.itemId })),
    )
    if (!id) return
    navigate(`/${ITEM_TYPE_ROUTES[itemType]}/${id}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="flex items-center gap-2 text-xl font-semibold text-text">
        <meta.icon size={22} className="text-muted" />
        {t('form.addTitle', { type: t(meta.labelKey) })}
      </h1>
      <ItemForm
        itemType={itemType}
        initialValues={EMPTY_ITEM_FORM_STATE}
        initialRelatedItems={[]}
        isSaving={isSaving}
        submitError={error}
        submitLabel={t('form.createSubmit')}
        onSubmit={(result) => void handleSubmit(result)}
        onCancel={() => navigate('/items/new')}
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
