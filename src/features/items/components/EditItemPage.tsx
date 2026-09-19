import { useNavigate, useParams } from 'react-router-dom'
import { ErrorState } from '@/components/ui/ErrorState'
import { ItemDetailSkeleton } from '@/features/items/components/ItemDetailSkeleton'
import { ItemForm, type ItemFormSubmitResult } from '@/features/items/components/ItemForm'
import { ItemNotFound } from '@/features/items/components/ItemNotFound'
import { ITEM_TYPE_META, ITEM_TYPE_ROUTES } from '@/features/items/constants'
import { detailToFormState } from '@/features/items/forms/formState'
import { useSaveItem } from '@/features/items/forms/useSaveItem'
import { appendItemCoverImage } from '@/features/items/imageApi'
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
  const { save, isSaving, error, errorKind } = useSaveItem(itemType)
  const meta = ITEM_TYPE_META[itemType]

  if (state.status === 'loading') {
    return <ItemDetailSkeleton />
  }

  if (state.status === 'not-found') {
    return <ItemNotFound itemType={itemType} />
  }

  if (state.status === 'error') {
    return <ErrorState message={t('listing.error', { message: state.message })} onRetry={state.reload} />
  }

  // The form copies its initial relationships once at mount and a save replaces
  // the stored links with whatever it holds, so it must not mount before they
  // are known — nor on a failed fetch, where it would delete them all.
  if (relationships.status === 'loading') {
    return <ItemDetailSkeleton />
  }

  if (relationships.status === 'error') {
    return <ErrorState message={t('form.relationshipsError')} onRetry={relationships.reload} />
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

  const initialBaseGames = relationships.parents
    .filter((parent) => parent.item_type === 'game')
    .map((parent) => ({ itemType: parent.item_type, itemId: parent.id, title: parent.title }))

  async function handleSubmit(result: ItemFormSubmitResult) {
    const savedId = await save(
      id ?? null,
      result.values,
      result.relatedItems.map((item) => ({ itemType: item.itemType, itemId: item.itemId })),
      result.baseGames?.map((item) => ({ itemType: item.itemType, itemId: item.itemId })),
    )
    if (!savedId) return
    let coverFailed = false
    if (result.coverImageFile) {
      try {
        await appendItemCoverImage(itemType, savedId, result.coverImageFile)
      } catch {
        coverFailed = true
      }
    }
    navigate(`/${ITEM_TYPE_ROUTES[itemType]}/${savedId}`, coverFailed ? { state: { coverUploadFailed: true } } : undefined)
  }

  return (
    <div className="flex min-h-full flex-col gap-6">
      <ItemForm
        key={id}
        itemType={itemType}
        title={
          <>
            <meta.icon size={22} className="text-muted" />
            {t('form.editTitle', { title: detail.title })}
          </>
        }
        initialValues={initialValues}
        initialRelatedItems={initialRelatedItems}
        initialBaseGames={initialBaseGames}
        excludeId={id}
        isSaving={isSaving}
        submitError={error}
        submitErrorKind={errorKind}
        submitLabel={t('form.editSubmit')}
        onSubmit={(result) => void handleSubmit(result)}
        onCancel={() => navigate(`/${ITEM_TYPE_ROUTES[itemType]}/${id}`)}
      />
    </div>
  )
}
