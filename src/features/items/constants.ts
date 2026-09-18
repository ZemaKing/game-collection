import {
  Archive,
  BookOpen,
  Boxes,
  Gamepad2,
  Gem,
  Package,
  PersonStanding,
  ShieldAlert,
  ShieldX,
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

/**
 * One accent color per item type, shared by the sidebar, stat tiles, item
 * cards, filters and the type picker so a given type reads the same
 * everywhere. `icon` colors the glyph; `badge` is the tinted pill background
 * used on cards/checkmarks (kept low-opacity so it holds up in both themes).
 */
export const ITEM_TYPE_COLORS: Record<ItemType, { icon: string; badge: string }> = {
  game: { icon: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300' },
  special_edition: { icon: 'text-amber-400', badge: 'bg-amber-500/15 text-amber-300' },
  steelbook: { icon: 'text-violet-400', badge: 'bg-violet-500/15 text-violet-300' },
  artbook: { icon: 'text-orange-400', badge: 'bg-orange-500/15 text-orange-300' },
  figure: { icon: 'text-rose-400', badge: 'bg-rose-500/15 text-rose-300' },
  stuff: { icon: 'text-slate-400', badge: 'bg-slate-500/15 text-slate-300' },
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

/** One glyph per condition tier, reused by the condition select, item cards, and filters. */
export const CONDITION_ICONS: Record<ItemCondition, LucideIcon> = {
  sealed: Package,
  mint: Gem,
  good: Star,
  fair: ShieldAlert,
  poor: ShieldX,
}

/** Same `{ icon, badge }` shape as `ITEM_TYPE_COLORS` — `badge` tints a whole pill, `icon` colors a bare glyph. */
export const CONDITION_COLORS: Record<ItemCondition, { icon: string; badge: string }> = {
  sealed: { icon: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300' },
  mint: { icon: 'text-sky-400', badge: 'bg-sky-500/15 text-sky-300' },
  good: { icon: 'text-lime-400', badge: 'bg-lime-500/15 text-lime-300' },
  fair: { icon: 'text-amber-400', badge: 'bg-amber-500/15 text-amber-300' },
  poor: { icon: 'text-rose-400', badge: 'bg-rose-500/15 text-rose-300' },
}

/** Brand glyphs keyed by `platforms.slug`, used in the sidebar and platform pages. */
export const PLATFORM_ICONS: Record<string, (props: PlatformIconProps) => ReactElement> = {
  'playstation-5': PlayStation5Icon,
  'playstation-4': PlayStation4Icon,
  steam: SteamIcon,
  'epic-games': EpicGamesIcon,
  xbox: XboxIcon,
}

/** Short badge labels keyed by `platforms.slug`, used on item card overlays. */
export const PLATFORM_SHORT_LABELS: Record<string, string> = {
  'playstation-5': 'PS5',
  'playstation-4': 'PS4',
  steam: 'Steam',
  'epic-games': 'Epic',
  xbox: 'Xbox',
}
