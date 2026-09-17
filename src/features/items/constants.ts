import {
  Archive,
  BookOpen,
  Boxes,
  Gamepad2,
  PersonStanding,
  Star,
  type LucideIcon,
} from 'lucide-react'
import type { ReactElement } from 'react'
import {
  EpicGamesIcon,
  PlayStation4Icon,
  PlayStation5Icon,
  SteamIcon,
  XboxIcon,
  type PlatformIconProps,
} from '@/components/icons/PlatformIcons'
import type { TranslationKey } from '@/lib/i18n'
import type { ItemCondition, ItemType } from '@/features/items/types'

export const ITEM_TYPES: ItemType[] = [
  'game',
  'special_edition',
  'steelbook',
  'artbook',
  'figure',
  'stuff',
]

export const ITEM_TYPE_META: Record<
  ItemType,
  { icon: LucideIcon; labelKey: TranslationKey }
> = {
  game: { icon: Gamepad2, labelKey: 'nav.games' },
  special_edition: { icon: Star, labelKey: 'nav.specialEditions' },
  steelbook: { icon: Archive, labelKey: 'nav.steelbooks' },
  artbook: { icon: BookOpen, labelKey: 'nav.artbooks' },
  figure: { icon: PersonStanding, labelKey: 'nav.figures' },
  stuff: { icon: Boxes, labelKey: 'nav.stuff' },
}

/** URL path segments, matching the sidebar links in `lib/navigation.ts`. */
export const ITEM_TYPE_ROUTES: Record<ItemType, string> = {
  game: 'games',
  special_edition: 'special-editions',
  steelbook: 'steelbooks',
  artbook: 'artbooks',
  figure: 'figures',
  stuff: 'stuff',
}

/** Table names in `supabase/migrations`, used by write paths (`useSaveItem`). */
export const ITEM_TABLE_NAMES: Record<ItemType, string> = {
  game: 'games',
  special_edition: 'special_editions',
  steelbook: 'steelbooks',
  artbook: 'artbooks',
  figure: 'figures',
  stuff: 'stuff',
}

export const CONDITION_LABEL_KEYS: Record<ItemCondition, TranslationKey> = {
  sealed: 'condition.sealed',
  mint: 'condition.mint',
  good: 'condition.good',
  fair: 'condition.fair',
  poor: 'condition.poor',
}

export const ITEM_CONDITIONS: ItemCondition[] = ['sealed', 'mint', 'good', 'fair', 'poor']

/** Brand glyphs keyed by `platforms.slug`, used in the sidebar and platform pages. */
export const PLATFORM_ICONS: Record<string, (props: PlatformIconProps) => ReactElement> = {
  'playstation-5': PlayStation5Icon,
  'playstation-4': PlayStation4Icon,
  steam: SteamIcon,
  'epic-games': EpicGamesIcon,
  xbox: XboxIcon,
}
