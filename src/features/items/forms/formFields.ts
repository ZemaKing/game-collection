import type { ItemFormState } from '@/features/items/forms/formState'
import type { ItemType } from '@/features/items/types'
import type { TranslationKey } from '@/lib/i18n'

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'date'
  | 'number'
  | 'platformSelect'
  | 'conditionSelect'
  | 'editionSelect'
  | 'completedToggle'
  | 'gameSelect'
  | 'dlcTypeToggle'

export interface FormFieldDef {
  name: keyof ItemFormState
  labelKey: TranslationKey
  kind: FieldKind
  required?: boolean
  rows?: number
}

export interface FormSectionDef {
  titleKey: TranslationKey
  fields: FormFieldDef[]
}

const titleField: FormFieldDef = { name: 'title', labelKey: 'form.title', kind: 'text', required: true }
const platformField: FormFieldDef = { name: 'platform_id', labelKey: 'filters.platform', kind: 'platformSelect' }
const releaseDateField: FormFieldDef = { name: 'release_date', labelKey: 'sort.release_date', kind: 'date' }
const collectionDateField: FormFieldDef = {
  name: 'collection_date',
  labelKey: 'filters.collectionDate',
  kind: 'date',
}
const conditionField: FormFieldDef = { name: 'condition', labelKey: 'filters.condition', kind: 'conditionSelect' }

const notesSection: FormSectionDef = {
  titleKey: 'form.sectionNotes',
  fields: [
    { name: 'description', labelKey: 'detail.about', kind: 'textarea', rows: 5 },
    { name: 'notes', labelKey: 'detail.notes', kind: 'textarea' },
  ],
}

export const FORM_SECTIONS: Record<ItemType, FormSectionDef[]> = {
  game: [
    {
      titleKey: 'form.sectionBasicInfo',
      fields: [
        titleField,
        platformField,
        { name: 'edition_name', labelKey: 'detail.editionName', kind: 'editionSelect' },
        releaseDateField,
        collectionDateField,
        conditionField,
        { name: 'completed', labelKey: 'completed.label', kind: 'completedToggle' },
      ],
    },
    {
      titleKey: 'form.sectionDetails',
      fields: [
        { name: 'developer', labelKey: 'detail.developer', kind: 'text' },
        { name: 'publisher', labelKey: 'detail.publisher', kind: 'text' },
      ],
    },
    notesSection,
  ],
  special_edition: [
    {
      titleKey: 'form.sectionBasicInfo',
      fields: [
        titleField,
        platformField,
        { name: 'edition_name', labelKey: 'detail.editionName', kind: 'editionSelect' },
        releaseDateField,
        collectionDateField,
        conditionField,
      ],
    },
    notesSection,
  ],
  steelbook: [
    {
      titleKey: 'form.sectionBasicInfo',
      fields: [
        titleField,
        platformField,
        { name: 'game_title', labelKey: 'detail.gameTitle', kind: 'text' },
        { name: 'edition_name', labelKey: 'detail.editionName', kind: 'editionSelect' },
        { name: 'steelbook_number', labelKey: 'detail.steelbookNumber', kind: 'text' },
        releaseDateField,
        collectionDateField,
        conditionField,
      ],
    },
    notesSection,
  ],
  artbook: [
    {
      titleKey: 'form.sectionBasicInfo',
      fields: [
        titleField,
        { name: 'publisher', labelKey: 'detail.publisher', kind: 'text' },
        releaseDateField,
        collectionDateField,
        conditionField,
      ],
    },
    {
      titleKey: 'form.sectionDetails',
      fields: [
        { name: 'page_count', labelKey: 'detail.pageCount', kind: 'number' },
        { name: 'isbn', labelKey: 'detail.isbn', kind: 'text' },
        { name: 'language', labelKey: 'detail.language', kind: 'text' },
      ],
    },
    notesSection,
  ],
  figure: [
    {
      titleKey: 'form.sectionBasicInfo',
      fields: [
        titleField,
        { name: 'manufacturer', labelKey: 'detail.manufacturer', kind: 'text' },
        { name: 'character_name', labelKey: 'detail.characterName', kind: 'text' },
        releaseDateField,
        collectionDateField,
        conditionField,
      ],
    },
    {
      titleKey: 'form.sectionDetails',
      fields: [
        { name: 'scale', labelKey: 'detail.scale', kind: 'text' },
        { name: 'material', labelKey: 'detail.material', kind: 'text' },
        { name: 'height_cm', labelKey: 'detail.height', kind: 'number' },
      ],
    },
    notesSection,
  ],
  dlc: [
    {
      titleKey: 'form.sectionBasicInfo',
      fields: [
        titleField,
        { name: 'game_id', labelKey: 'detail.baseGame', kind: 'gameSelect', required: true },
        { name: 'dlc_type', labelKey: 'dlc.type', kind: 'dlcTypeToggle' },
        releaseDateField,
        collectionDateField,
        conditionField,
        { name: 'completed', labelKey: 'completed.label', kind: 'completedToggle' },
      ],
    },
    notesSection,
  ],
  stuff: [
    {
      titleKey: 'form.sectionBasicInfo',
      fields: [
        titleField,
        { name: 'category', labelKey: 'detail.category', kind: 'text' },
        { name: 'manufacturer', labelKey: 'detail.manufacturer', kind: 'text' },
        releaseDateField,
        collectionDateField,
        conditionField,
      ],
    },
    notesSection,
  ],
}
