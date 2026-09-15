import {
  Archive,
  BookOpen,
  Boxes,
  Gamepad2,
  PersonStanding,
  Star,
  type LucideIcon,
} from 'lucide-react'
import type { TranslationKey } from '@/lib/i18n'
import type { ItemType } from '@/features/items/types'

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
