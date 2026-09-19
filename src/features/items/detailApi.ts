import { supabase } from '@/lib/supabaseClient'
import { FORMAT_TAG_SLUGS } from '@/features/items/constants'
import type { Tag } from '@/features/items/api'
import type { Genre, ItemType, Platform } from '@/features/items/types'
import type { ItemDetail, ItemImageRow } from '@/features/items/detailTypes'

const DETAIL_NULLS: Omit<ItemDetail, 'id' | 'item_type' | 'title' | 'created_at' | 'updated_at'> = {
  description: null,
  notes: null,
  release_date: null,
  collection_date: null,
  condition: null,
  platform: null,
  genres: [],
  developer: null,
  publisher: null,
  edition_name: null,
  game_title: null,
  steelbook_number: null,
  page_count: null,
  isbn: null,
  language: null,
  manufacturer: null,
  character_name: null,
  scale: null,
  material: null,
  height_cm: null,
  category: null,
}

async function fetchGameDetail(id: string): Promise<ItemDetail | null> {
  const { data, error } = await supabase
    .from('games')
    .select('*, platforms(id, name, slug), game_genres(position, genres(id, name, slug))')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  const genres = (
    (data.game_genres as { position: number; genres: Genre | null }[] | null) ?? []
  )
    .sort((a, b) => a.position - b.position)
    .map((row) => row.genres)
    .filter((g): g is Genre => g !== null)

  return {
    ...DETAIL_NULLS,
    id: data.id,
    item_type: 'game',
    title: data.title,
    description: data.description,
    notes: data.notes,
    release_date: data.release_date,
    collection_date: data.collection_date,
    condition: data.condition,
    created_at: data.created_at,
    updated_at: data.updated_at,
    platform: (data.platforms as Platform | null) ?? null,
    genres,
    developer: data.developer,
    publisher: data.publisher,
    edition_name: data.edition_name ?? null,
  }
}

async function fetchSpecialEditionDetail(id: string): Promise<ItemDetail | null> {
  const { data, error } = await supabase
    .from('special_editions')
    .select('*, platforms(id, name, slug)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  return {
    ...DETAIL_NULLS,
    id: data.id,
    item_type: 'special_edition',
    title: data.title,
    description: data.description,
    notes: data.notes,
    release_date: data.release_date,
    collection_date: data.collection_date,
    condition: data.condition,
    created_at: data.created_at,
    updated_at: data.updated_at,
    platform: (data.platforms as Platform | null) ?? null,
    edition_name: data.edition_name,
  }
}

async function fetchSteelbookDetail(id: string): Promise<ItemDetail | null> {
  const { data, error } = await supabase
    .from('steelbooks')
    .select('*, platforms(id, name, slug)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  return {
    ...DETAIL_NULLS,
    id: data.id,
    item_type: 'steelbook',
    title: data.title,
    description: data.description,
    notes: data.notes,
    release_date: data.release_date,
    collection_date: data.collection_date,
    condition: data.condition,
    created_at: data.created_at,
    updated_at: data.updated_at,
    platform: (data.platforms as Platform | null) ?? null,
    game_title: data.game_title,
    edition_name: data.edition_name,
    steelbook_number: data.steelbook_number,
  }
}

async function fetchArtbookDetail(id: string): Promise<ItemDetail | null> {
  const { data, error } = await supabase.from('artbooks').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return null

  return {
    ...DETAIL_NULLS,
    id: data.id,
    item_type: 'artbook',
    title: data.title,
    description: data.description,
    notes: data.notes,
    release_date: data.release_date,
    collection_date: data.collection_date,
    condition: data.condition,
    created_at: data.created_at,
    updated_at: data.updated_at,
    publisher: data.publisher,
    page_count: data.page_count,
    isbn: data.isbn,
    language: data.language,
  }
}

async function fetchFigureDetail(id: string): Promise<ItemDetail | null> {
  const { data, error } = await supabase.from('figures').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return null

  return {
    ...DETAIL_NULLS,
    id: data.id,
    item_type: 'figure',
    title: data.title,
    description: data.description,
    notes: data.notes,
    release_date: data.release_date,
    collection_date: data.collection_date,
    condition: data.condition,
    created_at: data.created_at,
    updated_at: data.updated_at,
    manufacturer: data.manufacturer,
    character_name: data.character_name,
    scale: data.scale,
    material: data.material,
    height_cm: data.height_cm,
  }
}

async function fetchStuffDetail(id: string): Promise<ItemDetail | null> {
  const { data, error } = await supabase.from('stuff').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return null

  return {
    ...DETAIL_NULLS,
    id: data.id,
    item_type: 'stuff',
    title: data.title,
    description: data.description,
    notes: data.notes,
    release_date: data.release_date,
    collection_date: data.collection_date,
    condition: data.condition,
    created_at: data.created_at,
    updated_at: data.updated_at,
    category: data.category,
    manufacturer: data.manufacturer,
  }
}

export async function fetchItemDetail(itemType: ItemType, id: string): Promise<ItemDetail | null> {
  switch (itemType) {
    case 'game':
      return fetchGameDetail(id)
    case 'special_edition':
      return fetchSpecialEditionDetail(id)
    case 'steelbook':
      return fetchSteelbookDetail(id)
    case 'artbook':
      return fetchArtbookDetail(id)
    case 'figure':
      return fetchFigureDetail(id)
    case 'stuff':
      return fetchStuffDetail(id)
  }
}

export async function fetchItemImages(itemType: ItemType, id: string): Promise<ItemImageRow[]> {
  const { data, error } = await supabase
    .from('item_images')
    .select('id, storage_path, position, is_cover, alt_text')
    .eq('item_type', itemType)
    .eq('item_id', id)
    .order('position')
  if (error) throw error
  return data ?? []
}

export async function fetchItemDetailTags(itemType: ItemType, id: string): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('item_tags')
    .select('tags(id, name, slug)')
    .eq('item_type', itemType)
    .eq('item_id', id)
  if (error) throw error
  return ((data as unknown as { tags: Tag | null }[] | null) ?? [])
    .map((row) => row.tags)
    .filter((t): t is Tag => t !== null && FORMAT_TAG_SLUGS.includes(t.slug))
}
