import { Link } from 'react-router-dom'
import { PlusIcon } from '@/components/icons/ActionIcons'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { ButtonIcon } from '@/components/ui/Button'
import { ItemCard } from '@/features/items/components/ItemCard'
import { ITEM_TYPE_COLORS, ITEM_TYPE_META } from '@/features/items/constants'
import type { AllItemRow } from '@/features/items/types'
import { useLocale } from '@/hooks/useLocale'

interface GameDlcSectionProps {
  gameId: string
  dlcs: AllItemRow[]
  /** Signed-in owner: shows "Add DLC" (and the per-card edit menu inside `ItemCard`). */
  canEdit: boolean
}

/**
 * The "DLC & Expansions" section of a game's detail page. Visitors only see it
 * when the game has DLCs; the owner always sees it, with an "Add DLC" button
 * that opens the add form with this game already chosen as the base game.
 */
export function GameDlcSection({ gameId, dlcs, canEdit }: GameDlcSectionProps) {
  const { t } = useLocale()
  if (dlcs.length === 0 && !canEdit) return null

  const Icon = ITEM_TYPE_META.dlc.icon
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="heading-section flex items-center gap-2 text-text">
          <Icon size={16} className={ITEM_TYPE_COLORS.dlc.icon} />
          {t('dlc.section')}
          {dlcs.length > 0 && <span className="text-sm font-medium text-muted">({dlcs.length})</span>}
        </h2>
        {canEdit && (
          <Link to={`/items/new?type=dlc&game=${gameId}`} className={buttonClasses({ variant: 'primary', size: 'sm' })}>
            <ButtonIcon icon={PlusIcon} variant="primary" size="sm" />
            {t('dlc.add')}
          </Link>
        )}
      </div>
      {dlcs.length === 0 ? (
        <p className="text-sm text-muted">{t('dlc.empty')}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {dlcs.map((dlc) => (
            // The base game's platform is already shown on this page, so the platform badge is omitted.
            <ItemCard key={dlc.id} item={dlc} platformName={null} view="grid" />
          ))}
        </div>
      )}
    </section>
  )
}
