import type { ItemDetail } from '@/features/items/detailTypes'
import type { DlcType } from '@/features/items/types'

/**
 * Controlled-input shape for the Add/Edit form — every field is a plain
 * string (or string[] for multi-selects) regardless of its eventual
 * database type, mirroring `ItemDetail`'s "one flat shape, unused fields
 * stay at their default" convention. `schemas.ts` is responsible for
 * parsing/coercing these strings into real values on submit.
 */
export interface ItemFormState {
  title: string
  release_date: string
  collection_date: string
  condition: string
  description: string
  tagIds: string[]

  platform_id: string

  developer: string
  publisher: string
  genreIds: string[]
  completed: boolean

  edition_name: string

  game_title: string
  steelbook_number: string

  page_count: string
  isbn: string
  language: string

  manufacturer: string
  character_name: string
  scale: string
  material: string
  height_cm: string

  category: string

  game_id: string
  dlc_type: DlcType
}

export const EMPTY_ITEM_FORM_STATE: ItemFormState = {
  title: '',
  release_date: '',
  collection_date: '',
  condition: '',
  description: '',
  tagIds: [],

  platform_id: '',

  developer: '',
  publisher: '',
  genreIds: [],
  completed: false,

  edition_name: '',

  game_title: '',
  steelbook_number: '',

  page_count: '',
  isbn: '',
  language: '',

  manufacturer: '',
  character_name: '',
  scale: '',
  material: '',
  height_cm: '',

  category: '',

  game_id: '',
  dlc_type: 'dlc',
}

/** Builds Edit-mode initial form state from a fetched item + its tag/genre ids. */
export function detailToFormState(
  detail: ItemDetail,
  tagIds: string[],
  genreIds: string[],
): ItemFormState {
  return {
    ...EMPTY_ITEM_FORM_STATE,
    title: detail.title,
    release_date: detail.release_date ?? '',
    collection_date: detail.collection_date ?? '',
    condition: detail.condition ?? '',
    description: detail.description ?? '',
    tagIds,
    platform_id: detail.platform?.id ?? '',
    developer: detail.developer ?? '',
    publisher: detail.publisher ?? '',
    genreIds,
    completed: detail.completed,
    edition_name: detail.edition_name ?? '',
    game_title: detail.game_title ?? '',
    steelbook_number: detail.steelbook_number ?? '',
    page_count: detail.page_count != null ? String(detail.page_count) : '',
    isbn: detail.isbn ?? '',
    language: detail.language ?? '',
    manufacturer: detail.manufacturer ?? '',
    character_name: detail.character_name ?? '',
    scale: detail.scale ?? '',
    material: detail.material ?? '',
    height_cm: detail.height_cm != null ? String(detail.height_cm) : '',
    category: detail.category ?? '',
    game_id: detail.base_game_id ?? '',
    dlc_type: detail.dlc_type ?? 'dlc',
  }
}
