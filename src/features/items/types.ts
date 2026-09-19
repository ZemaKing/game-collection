export type ItemType =
  | 'game'
  | 'special_edition'
  | 'steelbook'
  | 'artbook'
  | 'figure'
  | 'stuff'

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
  region: string | null
  release_date: string | null
  collection_date: string | null
  condition: ItemCondition | null
  notes: string | null
  description: string | null
  cover_image_path: string | null
  /** First genre (by name) linked to the item, if any — games only. */
  genre_slug: string | null
  genre_name: string | null
  /** Edition text for games / special editions / steelbooks; absent until the edition migration is applied. */
  edition_name?: string | null
  /** Slug of the item's Digital / Physical tag, if set. Not part of the view — attached by `withFormats`. */
  format_slug?: string | null
  created_at: string
  updated_at: string
}
