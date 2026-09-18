import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/ui/EmptyState'
import { ITEM_TYPE_META, ITEM_TYPE_ROUTES } from '@/features/items/constants'
import type { ItemType } from '@/features/items/types'
import { useLocale } from '@/hooks/useLocale'

/** Shared "item doesn't exist" state for detail/edit pages across all six item types. */
export function ItemNotFound({ itemType }: { itemType: ItemType }) {
  const { t } = useLocale()
  const meta = ITEM_TYPE_META[itemType]
  return (
    <EmptyState
      icon={meta.icon}
      title={t('detail.notFound.title')}
      body={t('detail.notFound.body')}
      action={
        <Link
          to={`/${ITEM_TYPE_ROUTES[itemType]}`}
          className="mt-2 text-sm font-semibold text-accent hover:text-accent-hover"
        >
          {t('detail.backToListing', { label: t(meta.labelKey) })}
        </Link>
      }
    />
  )
}
