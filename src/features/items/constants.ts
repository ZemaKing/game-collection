import {
  Archive,
  BookOpen,
  Boxes,
  ChessKnight,
  Compass,
  Crosshair,
  Eye,
  Flag,
  Flame,
  Gamepad2,
  Gauge,
  Gem,
  Ghost,
  HandFist,
  Joystick,
  Map,
  Music2,
  Package,
  PartyPopper,
  PersonStanding,
  PlayingCards,
  Puzzle,
  Shield,
  ShieldAlert,
  ShieldX,
  Skull,
  SlidersHorizontal,
  Star,
  Swords,
  Trophy,
  Users,
  GraduationCap,
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
export const ITEM_TYPE_COLORS: Record<ItemType, { icon: string; badge: string; hoverBorder: string }> = {
  game: { icon: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300', hoverBorder: 'hover:border-emerald-400/60' },
  special_edition: { icon: 'text-amber-400', badge: 'bg-amber-500/15 text-amber-300', hoverBorder: 'hover:border-amber-400/60' },
  steelbook: { icon: 'text-violet-400', badge: 'bg-violet-500/15 text-violet-300', hoverBorder: 'hover:border-violet-400/60' },
  artbook: { icon: 'text-orange-400', badge: 'bg-orange-500/15 text-orange-300', hoverBorder: 'hover:border-orange-400/60' },
  figure: { icon: 'text-rose-400', badge: 'bg-rose-500/15 text-rose-300', hoverBorder: 'hover:border-rose-400/60' },
  stuff: { icon: 'text-slate-400', badge: 'bg-slate-500/15 text-slate-300', hoverBorder: 'hover:border-slate-400/60' },
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

/**
 * One glyph + accent color per genre, keyed by `genres.slug`, shared by genre
 * chips on the detail page, the genre filter, and the dashboard genre list.
 * Same `{ icon, badge }` shape as `ITEM_TYPE_COLORS`.
 */
export const GENRE_META: Record<string, { icon: LucideIcon; color: { icon: string; badge: string } }> = {
  action: { icon: Swords, color: { icon: 'text-cyan-400', badge: 'bg-cyan-500/15 text-cyan-300' } },
  adventure: { icon: Compass, color: { icon: 'text-yellow-400', badge: 'bg-yellow-500/15 text-yellow-300' } },
  rpg: { icon: Shield, color: { icon: 'text-violet-400', badge: 'bg-violet-500/15 text-violet-300' } },
  simulation: { icon: SlidersHorizontal, color: { icon: 'text-orange-400', badge: 'bg-orange-500/15 text-orange-300' } },
  roguelike: { icon: Skull, color: { icon: 'text-rose-400', badge: 'bg-rose-500/15 text-rose-300' } },
  strategy: { icon: ChessKnight, color: { icon: 'text-blue-400', badge: 'bg-blue-500/15 text-blue-300' } },
  shooter: { icon: Crosshair, color: { icon: 'text-red-400', badge: 'bg-red-500/15 text-red-300' } },
  racing: { icon: Gauge, color: { icon: 'text-teal-400', badge: 'bg-teal-500/15 text-teal-300' } },
  sports: { icon: Trophy, color: { icon: 'text-amber-400', badge: 'bg-amber-500/15 text-amber-300' } },
  fighting: { icon: HandFist, color: { icon: 'text-red-500', badge: 'bg-red-600/15 text-red-400' } },
  horror: { icon: Ghost, color: { icon: 'text-purple-400', badge: 'bg-purple-500/15 text-purple-300' } },
  survival: { icon: Flame, color: { icon: 'text-orange-500', badge: 'bg-orange-600/15 text-orange-400' } },
  puzzle: { icon: Puzzle, color: { icon: 'text-sky-400', badge: 'bg-sky-500/15 text-sky-300' } },
  platformer: { icon: Flag, color: { icon: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300' } },
  stealth: { icon: Eye, color: { icon: 'text-indigo-400', badge: 'bg-indigo-500/15 text-indigo-300' } },
  mmo: { icon: Users, color: { icon: 'text-fuchsia-400', badge: 'bg-fuchsia-500/15 text-fuchsia-300' } },
  sandbox: { icon: Boxes, color: { icon: 'text-amber-500', badge: 'bg-amber-600/15 text-amber-400' } },
  'open-world': { icon: Map, color: { icon: 'text-emerald-500', badge: 'bg-emerald-600/15 text-emerald-400' } },
  'card-game': { icon: PlayingCards, color: { icon: 'text-pink-500', badge: 'bg-pink-600/15 text-pink-400' } },
  'rhythm-music': { icon: Music2, color: { icon: 'text-pink-400', badge: 'bg-pink-500/15 text-pink-300' } },
  party: { icon: PartyPopper, color: { icon: 'text-lime-400', badge: 'bg-lime-500/15 text-lime-300' } },
  arcade: { icon: Joystick, color: { icon: 'text-cyan-500', badge: 'bg-cyan-600/15 text-cyan-400' } },
  'visual-novel': { icon: BookOpen, color: { icon: 'text-rose-300', badge: 'bg-rose-400/15 text-rose-200' } },
  educational: { icon: GraduationCap, color: { icon: 'text-blue-500', badge: 'bg-blue-600/15 text-blue-400' } },
}

/** Fallback for a genre slug not present in `GENRE_META` (e.g. a custom genre added directly in the DB). */
export const DEFAULT_GENRE_META = {
  icon: Gamepad2,
  color: { icon: 'text-slate-400', badge: 'bg-slate-500/15 text-slate-300' },
}
