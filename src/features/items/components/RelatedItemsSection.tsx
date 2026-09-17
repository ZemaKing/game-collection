import { ItemCard } from '@/features/items/components/ItemCard'
import type { RelatedItemRow } from '@/features/items/relationshipApi'
import type { TranslationKey } from '@/lib/i18n'
import { useLocale } from '@/hooks/useLocale'

interface RelatedItemsSectionProps {
  titleKey: TranslationKey
  items: RelatedItemRow[]
  platformById: Map<string, string>
}

/**
 * Renders a set of related items (a special edition's base game, its
 * contents, or any other item's related items) as a card grid — never a
 * graph/diagram — so the relationship is understandable at a glance and
 * each card is a real link to that item's own detail page.
 */
export function RelatedItemsSection({ titleKey, items, platformById }: RelatedItemsSectionProps) {
  const { t } = useLocale()
  if (items.length === 0) return null

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-text">{t(titleKey)}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            platformName={item.platform_id ? (platformById.get(item.platform_id) ?? null) : null}
            view="grid"
            showTypeBadge
          />
        ))}
      </div>
    </section>
  )
}
