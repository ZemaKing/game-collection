export type ItemType =
  | 'game'
  | 'special_edition'
  | 'steelbook'
  | 'artbook'
  | 'figure'
  | 'stuff'
  | 'dlc'

export type DlcType = 'dlc' | 'expansion'

export type ItemCondition = 'sealed' | 'mint' | 'good' | 'fair' | 'poor'

export interface Platform {
  id: string
  name: string
  slug: string
}

export interface Genre {
  id: string
  name: string
  slug: string
}

/** Row shape of the `all_items` unified view (see supabase/migrations). */
export interface AllItemRow {
  id: string
  item_type: ItemType
  title: string
  subtitle: string | null
  platform_id: string | null
  release_date: string | null
  collection_date: string | null
  condition: ItemCondition | null
  /** The full text: only on rows from `select('*')`. Listing queries select `has_description` instead (`ALL_ITEM_COLUMNS`). */
  description?: string | null
  /** Computed field (migration `20261011120000_all_items_has_description.sql`): the item has a non-empty description. */
  has_description?: boolean
  cover_image_path: string | null
  /** First genre (by name) linked to the item, if any — games only. */
  genre_slug: string | null
  genre_name: string | null
  /** Edition text for games / special editions / steelbooks; absent until the edition migration is applied. */
  edition_name?: string | null
  /** Games and DLCs: the owner has played it through. Absent until the completed migration is applied. */
  completed?: boolean
  /** DLCs only: id of the base game this DLC belongs to (also the item's `subtitle` source). */
  parent_game_id?: string | null
  /** The cover's WebP thumbnail (`item_images.thumb_path`); null until the image migration has run. Absent until the image-variants migration is applied. */
  cover_thumb_path?: string | null
  /** Slug of the item's Digital / Physical tag, if set. Computed field (migration `20261011130000_all_items_format_slug.sql`), selected by `ALL_ITEM_COLUMNS`. */
  format_slug?: string | null
  created_at: string
  updated_at: string
}
