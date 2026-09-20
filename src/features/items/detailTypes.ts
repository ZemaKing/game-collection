import type { DlcType, Genre, ItemCondition, ItemType, Platform } from '@/features/items/types'

/**
 * Full record for a single item's detail page, fetched from its specific
 * table (not the normalized `all_items` view) so every type-specific column
 * is available. Fields that don't apply to `item_type` are simply null/[].
 */
export interface ItemDetail {
  id: string
  item_type: ItemType
  title: string
  description: string | null
  release_date: string | null
  collection_date: string | null
  condition: ItemCondition | null
  created_at: string
  updated_at: string

  platform: Platform | null
  genres: Genre[]

  // Games
  developer: string | null
  publisher: string | null
  completed: boolean

  // Games / special editions / steelbooks
  edition_name: string | null

  // Steelbooks
  game_title: string | null
  steelbook_number: string | null

  // Artbooks
  page_count: number | null
  isbn: string | null
  language: string | null

  // Figures
  manufacturer: string | null
  character_name: string | null
  scale: string | null
  material: string | null
  height_cm: number | null

  // Stuff
  category: string | null

  // DLCs
  /** The base game this DLC belongs to — always set for DLCs (`dlcs.game_id` is NOT NULL). */
  base_game_id: string | null
  dlc_type: DlcType | null
}

export interface ItemImageRow {
  id: string
  storage_path: string
  position: number
  is_cover: boolean
  alt_text: string | null
}
