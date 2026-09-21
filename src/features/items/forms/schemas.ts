import { z } from 'zod'
import { ITEM_CONDITIONS } from '@/features/items/constants'
import type { ItemType } from '@/features/items/types'

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))

const optionalCondition = z.preprocess(
  (value) => (value === '' || value == null ? undefined : value),
  z.enum(ITEM_CONDITIONS).optional(),
)

const optionalPositiveInt = z.preprocess(
  (value) => (value === '' || value == null ? undefined : Number(value)),
  z
    .number('errors.mustBeNumber')
    .int('errors.mustBeWholeNumber')
    .positive('errors.mustBePositive')
    .optional(),
)

const optionalPositiveNumber = z.preprocess(
  (value) => (value === '' || value == null ? undefined : Number(value)),
  z.number('errors.mustBeNumber').positive('errors.mustBePositive').optional(),
)

const idArray = z.array(z.string()).default([])

// Shared by every item table (see supabase/migrations Phase 4 schema).
const commonFields = {
  title: z.string().trim().min(1, 'errors.titleRequired'),
  release_date: optionalText,
  collection_date: optionalText,
  condition: optionalCondition,
  description: optionalText,
  tagIds: idArray,
}

export const gameSchema = z.object({
  ...commonFields,
  platform_id: optionalText,
  edition_name: optionalText,
  developer: optionalText,
  publisher: optionalText,
  genreIds: idArray,
  completed: z.boolean().default(false),
})

export const specialEditionSchema = z.object({
  ...commonFields,
  platform_id: optionalText,
  edition_name: optionalText,
})

export const steelbookSchema = z.object({
  ...commonFields,
  platform_id: optionalText,
})

export const artbookSchema = z.object({
  ...commonFields,
  publisher: optionalText,
  page_count: optionalPositiveInt,
  isbn: optionalText,
  language: optionalText,
})

export const figureSchema = z.object({
  ...commonFields,
  manufacturer: optionalText,
  character_name: optionalText,
  scale: optionalText,
  material: optionalText,
  height_cm: optionalPositiveNumber,
})

export const stuffSchema = z.object({
  ...commonFields,
  category: optionalText,
  manufacturer: optionalText,
})

export const dlcSchema = z.object({
  ...commonFields,
  game_id: z.string().trim().min(1, 'errors.baseGameRequired'),
  dlc_type: z.enum(['dlc', 'expansion']).default('dlc'),
  completed: z.boolean().default(false),
})

export const ITEM_SCHEMAS = {
  game: gameSchema,
  special_edition: specialEditionSchema,
  steelbook: steelbookSchema,
  artbook: artbookSchema,
  figure: figureSchema,
  stuff: stuffSchema,
  dlc: dlcSchema,
} satisfies Record<ItemType, z.ZodObject>

export type GameFormValues = z.infer<typeof gameSchema>
export type SpecialEditionFormValues = z.infer<typeof specialEditionSchema>
export type SteelbookFormValues = z.infer<typeof steelbookSchema>
export type ArtbookFormValues = z.infer<typeof artbookSchema>
export type FigureFormValues = z.infer<typeof figureSchema>
export type StuffFormValues = z.infer<typeof stuffSchema>
export type DlcFormValues = z.infer<typeof dlcSchema>

export type ItemFormValues =
  | GameFormValues
  | SpecialEditionFormValues
  | SteelbookFormValues
  | ArtbookFormValues
  | FigureFormValues
  | StuffFormValues
  | DlcFormValues
