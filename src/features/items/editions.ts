import {
  Award,
  BookOpen,
  Bookmark,
  Boxes,
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
  | 'game-bundle'
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
 * The supported editions, in selector order. Colors are not listed here —
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
    key: 'game-bundle',
    canonicalName: 'Game Bundle Edition',
    icon: Boxes,
    nameKey: 'edition.gameBundle',
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

/** Neutral look for free-text edition names that don't match a known edition (e.g. "Collector's Edition"). */
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

export interface EditionGroup {
  /** Stable id: the known edition's key, or `custom:<normalized name>`. */
  id: string
  /** Every distinct stored `edition_name` that resolves to this edition (e.g. "GOTY" and "Game of the Year Edition"). */
  names: string[]
  /** One stored name to render the label/glyph from. */
  name: string
  edition: EditionDef | null
}

/**
 * Collapses the distinct stored edition names into filter options: spellings of
 * the same known edition become one option; free-text names stay separate.
 * Known editions come first in selector order, then custom names A–Z.
 */
export function groupEditionNames(names: string[]): EditionGroup[] {
  const groups = new Map<string, EditionGroup>()
  for (const name of names) {
    const edition = resolveEdition(name)
    const id = edition ? edition.key : `custom:${normalize(name)}`
    const existing = groups.get(id)
    if (existing) existing.names.push(name)
    else groups.set(id, { id, names: [name], name, edition })
  }
  const known = EDITIONS.map((e) => groups.get(e.key)).filter((g): g is EditionGroup => !!g)
  const custom = [...groups.values()]
    .filter((g) => !g.edition)
    .sort((a, b) => a.name.localeCompare(b.name))
  return [...known, ...custom]
}

/** Localized display text for an edition name, e.g. "Deluxe Edition" / "Deluxe Izdanje". */
export function editionDisplayName(
  name: string,
  t: (key: TranslationKey) => string,
): string {
  const edition = resolveEdition(name)
  return edition ? `${t(edition.nameKey)} ${t('edition.suffix')}` : name
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
