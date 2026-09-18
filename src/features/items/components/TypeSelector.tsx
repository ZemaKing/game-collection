import { Link } from 'react-router-dom'
import { ITEM_TYPES, ITEM_TYPE_COLORS, ITEM_TYPE_META } from '@/features/items/constants'
import { useLocale } from '@/hooks/useLocale'

/** Step 1 of Add: pick which of the six item types to create (Phase 16 task 1). */
export function TypeSelector() {
  const { t } = useLocale()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-text">{t('form.chooseType')}</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ITEM_TYPES.map((type) => {
          const meta = ITEM_TYPE_META[type]
          return (
            <Link
              key={type}
              to={`/items/new?type=${type}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-6 text-center transition-colors hover:border-accent hover:bg-card-hover"
            >
              <meta.icon size={28} className={ITEM_TYPE_COLORS[type].icon} />
              <span className="text-sm font-medium text-text">{t(meta.labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
