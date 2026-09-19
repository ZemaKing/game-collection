import { CONDITION_LABEL_KEYS } from '@/features/items/constants'
import { formatDate } from '@/features/items/format'
import type { ItemDetail } from '@/features/items/detailTypes'
import type { ItemType } from '@/features/items/types'
import type { Locale, TranslationKey } from '@/lib/i18n'

export interface DetailFieldDef {
  labelKey: TranslationKey
  value: (detail: ItemDetail, t: (key: TranslationKey) => string, locale: Locale) => string | null
}

const platformField: DetailFieldDef = {
  labelKey: 'filters.platform',
  value: (d) => d.platform?.name ?? null,
}
const releaseDateField: DetailFieldDef = {
  labelKey: 'sort.release_date',
  value: (d, _t, locale) => (d.release_date ? formatDate(d.release_date, locale) : null),
}
const collectionDateField: DetailFieldDef = {
  labelKey: 'filters.collectionDate',
  value: (d, _t, locale) => (d.collection_date ? formatDate(d.collection_date, locale) : null),
}
const conditionField: DetailFieldDef = {
  labelKey: 'filters.condition',
  value: (d, t) => (d.condition ? t(CONDITION_LABEL_KEYS[d.condition]) : null),
}

export const DETAIL_FIELDS: Record<ItemType, DetailFieldDef[]> = {
  game: [
    platformField,
    { labelKey: 'detail.editionName', value: (d) => d.edition_name },
    { labelKey: 'detail.developer', value: (d) => d.developer },
    { labelKey: 'detail.publisher', value: (d) => d.publisher },
    releaseDateField,
    collectionDateField,
    conditionField,
  ],
  special_edition: [
    platformField,
    { labelKey: 'detail.editionName', value: (d) => d.edition_name },
    releaseDateField,
    collectionDateField,
    conditionField,
  ],
  steelbook: [
    platformField,
    { labelKey: 'detail.gameTitle', value: (d) => d.game_title },
    { labelKey: 'detail.editionName', value: (d) => d.edition_name },
    { labelKey: 'detail.steelbookNumber', value: (d) => d.steelbook_number },
    releaseDateField,
    collectionDateField,
    conditionField,
  ],
  artbook: [
    { labelKey: 'detail.publisher', value: (d) => d.publisher },
    { labelKey: 'detail.pageCount', value: (d) => (d.page_count != null ? String(d.page_count) : null) },
    { labelKey: 'detail.isbn', value: (d) => d.isbn },
    { labelKey: 'detail.language', value: (d) => d.language },
    releaseDateField,
    collectionDateField,
    conditionField,
  ],
  figure: [
    { labelKey: 'detail.manufacturer', value: (d) => d.manufacturer },
    { labelKey: 'detail.characterName', value: (d) => d.character_name },
    { labelKey: 'detail.scale', value: (d) => d.scale },
    { labelKey: 'detail.material', value: (d) => d.material },
    { labelKey: 'detail.height', value: (d) => (d.height_cm != null ? `${d.height_cm} cm` : null) },
    releaseDateField,
    collectionDateField,
    conditionField,
  ],
  stuff: [
    { labelKey: 'detail.category', value: (d) => d.category },
    { labelKey: 'detail.manufacturer', value: (d) => d.manufacturer },
    releaseDateField,
    collectionDateField,
    conditionField,
  ],
}
