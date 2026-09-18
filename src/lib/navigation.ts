import {
  Archive,
  BookOpen,
  Boxes,
  Clock,
  Gamepad2,
  LayoutDashboard,
  LayoutGrid,
  PersonStanding,
  Star,
  type LucideIcon,
} from 'lucide-react'
import type { ComponentType } from 'react'
import {
  EpicGamesIcon,
  PlayStation4Icon,
  PlayStation5Icon,
  SteamIcon,
  XboxIcon,
} from '@/components/icons/PlatformIcons'
import type { TranslationKey } from '@/lib/i18n'
import type { ItemType } from '@/features/items/types'

type IconComponent = ComponentType<{ size?: number; className?: string }>

export interface NavItem {
  labelKey: TranslationKey
  to: string
  icon: LucideIcon
  /** Set on the six type-listing rows so they can pick up `ITEM_TYPE_COLORS`. */
  itemType?: ItemType
}

export const primaryNavItems: NavItem[] = [
  { labelKey: 'nav.dashboard', to: '/', icon: LayoutDashboard },
  { labelKey: 'nav.allItems', to: '/items', icon: LayoutGrid },
  { labelKey: 'nav.games', to: '/games', icon: Gamepad2, itemType: 'game' },
  { labelKey: 'nav.specialEditions', to: '/special-editions', icon: Star, itemType: 'special_edition' },
  { labelKey: 'nav.steelbooks', to: '/steelbooks', icon: Archive, itemType: 'steelbook' },
  { labelKey: 'nav.artbooks', to: '/artbooks', icon: BookOpen, itemType: 'artbook' },
  { labelKey: 'nav.figures', to: '/figures', icon: PersonStanding, itemType: 'figure' },
  { labelKey: 'nav.stuff', to: '/stuff', icon: Boxes, itemType: 'stuff' },
]

// Platform names are proper nouns and are not translated. Slugs must match
// the `platforms.slug` seed values so `/platforms/:slug` resolves them.
export const platformNavItems: { label: string; to: string; icon: IconComponent }[] = [
  { label: 'PlayStation 5', to: '/platforms/playstation-5', icon: PlayStation5Icon },
  { label: 'PlayStation 4', to: '/platforms/playstation-4', icon: PlayStation4Icon },
  { label: 'Steam', to: '/platforms/steam', icon: SteamIcon },
  { label: 'Epic Games', to: '/platforms/epic-games', icon: EpicGamesIcon },
  { label: 'Xbox', to: '/platforms/xbox', icon: XboxIcon },
]

export const collectionNavItems: NavItem[] = [
  { labelKey: 'nav.recentlyAdded', to: '/recently-added', icon: Clock },
]
