import { useNavigate, useParams } from 'react-router-dom'
import { ItemForm, type ItemFormSubmitResult } from '@/features/items/components/ItemForm'
import { ITEM_TYPE_META, ITEM_TYPE_ROUTES } from '@/features/items/constants'
import { detailToFormState } from '@/features/items/forms/formState'
import { useSaveItem } from '@/features/items/forms/useSaveItem'
import type { ItemType } from '@/features/items/types'
import { useItemDetail } from '@/features/items/useItemDetail'
import { useItemRelationships } from '@/features/items/useItemRelationships'
import { useLocale } from '@/hooks/useLocale'

interface EditItemPageProps {
  itemType: ItemType
}

/** Shared Edit page for all six item types — mirrors `ItemDetailPage`'s `itemType` prop convention. */
export function EditItemPage({ itemType }: EditItemPageProps) {
  const { t } = useLocale()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const state = useItemDetail(itemType, id)
  const relationships = useItemRelationships(itemType, id)
  const { save, isSaving, error } = useSaveItem(itemType)
  const meta = ITEM_TYPE_META[itemType]

  if (state.status === 'loading') {
    return <p className="text-center text-sm text-muted">{t('listing.loading')}</p>
  }

  if (state.status === 'not-found') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
        <meta.icon size={32} className="text-muted" />
        <h1 className="text-lg font-semibold text-text">{t('detail.notFound.title')}</h1>
        <p className="max-w-sm text-sm text-muted">{t('detail.notFound.body')}</p>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <p className="rounded-lg border border-danger bg-danger-bg px-4 py-3 text-sm text-danger">
        {t('listing.error', { message: state.message })}
      </p>
    )
  }

  const { detail, tags } = state
  const initialValues = detailToFormState(
    detail,
    tags.map((tag) => tag.id),
    detail.genres.map((genre) => genre.id),
  )
  const initialRelatedItems = relationships.children.map((child) => ({
    itemType: child.item_type,
    itemId: child.id,
    title: child.title,
  }))

  async function handleSubmit(result: ItemFormSubmitResult) {
    const savedId = await save(
      id ?? null,
      result.values,
      result.relatedItems.map((item) => ({ itemType: item.itemType, itemId: item.itemId })),
    )
    if (!savedId) return
    navigate(`/${ITEM_TYPE_ROUTES[itemType]}/${savedId}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-text">
        <meta.icon size={22} className="text-muted" />
        {t('form.editTitle', { title: detail.title })}
      </h1>
      <ItemForm
        key={id}
        itemType={itemType}
        initialValues={initialValues}
        initialRelatedItems={initialRelatedItems}
        excludeId={id}
        isSaving={isSaving}
        submitError={error}
        submitLabel={t('form.editSubmit')}
        onSubmit={(result) => void handleSubmit(result)}
        onCancel={() => navigate(`/${ITEM_TYPE_ROUTES[itemType]}/${id}`)}
      />
    </div>
  )
}
