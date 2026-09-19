import {
  Award,
  BookOpen,
  Bookmark,
  Coins,
  Crown,
  Diamond,
  Gamepad2,
  Gem,
  Medal,
  Package,
  Rocket,
  Sparkles,
  Star,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import type { TranslationKey } from '@/lib/i18n'

export type EditionKey =
  | 'day-one'
  | 'launch'
  | 'special'
  | 'limited'
  | 'deluxe'
  | 'gold'
  | 'ultimate'
  | 'premium'
  | 'complete'
  | 'definitive'
  | 'game-of-the-year'
  | 'anniversary'
  | 'collectors'

export interface EditionDef {
  key: EditionKey
  /** Canonical English name — this is what gets stored in `edition_name` when picked from the selector. */
  canonicalName: string
  icon: LucideIcon
  /** Short localized name without the "Edition" suffix; the suffix is `edition.suffix`. */
  nameKey: TranslationKey
  /** Extra normalized spellings that resolve to this edition. */
  aliases?: string[]
}

/**
 * The 12 supported editions, in selector order. Colors are not listed here —
 * they live in `index.css` as `[data-edition='<key>']` tokens so light/dark
 * variants sit next to the rest of the theme variables.
 */
export const EDITIONS: EditionDef[] = [
  {
    key: 'day-one',
    canonicalName: 'Day One Edition',
    icon: Gamepad2,
    nameKey: 'edition.dayOne',
    aliases: ['day 1'],
  },
  {
    key: 'launch',
    canonicalName: 'Launch Edition',
    icon: Rocket,
    nameKey: 'edition.launch',
  },
  {
    key: 'special',
    canonicalName: 'Special Edition',
    icon: Star,
    nameKey: 'edition.special',
  },
  {
    key: 'limited',
    canonicalName: 'Limited Edition',
    icon: Diamond,
    nameKey: 'edition.limited',
  },
  {
    key: 'deluxe',
    canonicalName: 'Deluxe Edition',
    icon: Crown,
    nameKey: 'edition.deluxe',
  },
  {
    key: 'gold',
    canonicalName: 'Gold Edition',
    icon: Coins,
    nameKey: 'edition.gold',
  },
  {
    key: 'ultimate',
    canonicalName: 'Ultimate Edition',
    icon: Award,
    nameKey: 'edition.ultimate',
  },
  {
    key: 'premium',
    canonicalName: 'Premium Edition',
    icon: Gem,
    nameKey: 'edition.premium',
  },
  {
    key: 'complete',
    canonicalName: 'Complete Edition',
    icon: Package,
    nameKey: 'edition.complete',
  },
  {
    key: 'definitive',
    canonicalName: 'Definitive Edition',
    icon: BookOpen,
    nameKey: 'edition.definitive',
  },
  {
    key: 'game-of-the-year',
    canonicalName: 'Game of the Year Edition',
    icon: Trophy,
    nameKey: 'edition.gameOfTheYear',
    aliases: ['goty'],
  },
  {
    key: 'anniversary',
    canonicalName: 'Anniversary Edition',
    icon: Medal,
    nameKey: 'edition.anniversary',
  },
  {
    key: 'collectors',
    canonicalName: "Collector's Edition",
    icon: Sparkles,
    nameKey: 'edition.collectors',
    aliases: ['collector'],
  },
]

/** Neutral look for free-text edition names that don't match one of the 12 (e.g. "Collector's Edition"). */
export const CUSTOM_EDITION_ICON: LucideIcon = Bookmark

const EDITION_LOOKUP = new Map<string, EditionDef>()
for (const edition of EDITIONS) {
  const short = normalize(edition.canonicalName.replace(/ Edition$/, ''))
  EDITION_LOOKUP.set(short, edition)
  for (const alias of edition.aliases ?? []) EDITION_LOOKUP.set(alias, edition)
}

function normalize(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Maps free-text `edition_name` to a known edition, or null. Tolerates case,
 * a trailing "Edition"/"Izdanje", aliases ("GOTY", "Day 1") and numbered
 * anniversaries ("20th Anniversary Edition").
 */
export function resolveEdition(
  name: string | null | undefined,
): EditionDef | null {
  if (!name) return null
  const stripped = normalize(name).replace(/ (edition|izdanje)$/, '')
  if (!stripped) return null
  const exact = EDITION_LOOKUP.get(stripped)
  if (exact) return exact
  if (/\banniversary$/.test(stripped))
    return EDITION_LOOKUP.get('anniversary') ?? null
  return null
}

/** Item types that carry an edition (`edition_name`): games, special editions and steelbooks. */
export function hasEditionField(itemType: string): boolean {
  return (
    itemType === 'game' ||
    itemType === 'special_edition' ||
    itemType === 'steelbook'
  )
}

/**
 * The edition text of an `all_items` row. Falls back to `subtitle` for special
 * editions/steelbooks (where the view has always put the edition name) so their
 * badges keep working on a database that hasn't got the `edition_name` column yet.
 */
export function editionNameOf(item: {
  item_type: string
  subtitle: string | null
  edition_name?: string | null
}): string | null {
  if (item.edition_name) return item.edition_name
  if (item.item_type === 'special_edition' || item.item_type === 'steelbook')
    return item.subtitle || null
  return null
}
