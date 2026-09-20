import { describe, expect, it } from 'vitest'
import { ITEM_SCHEMAS, artbookSchema, dlcSchema, figureSchema, gameSchema } from '@/features/items/forms/schemas'

describe('item form schemas', () => {
  it('requires a non-blank title for every item type', () => {
    for (const schema of Object.values(ITEM_SCHEMAS)) {
      // `game_id` is only required (and only kept) for DLCs; the other schemas ignore it.
      expect(schema.safeParse({ title: '   ', game_id: 'g1' }).success).toBe(false)
      expect(schema.safeParse({ title: 'Ok', game_id: 'g1' }).success).toBe(true)
    }
  })

  it('requires a base game for a DLC', () => {
    const missing = dlcSchema.safeParse({ title: 'Wrath of the Druids', game_id: '  ' })
    expect(missing.success).toBe(false)
    expect(missing.error?.issues[0].message).toBe('errors.baseGameRequired')
    expect(dlcSchema.safeParse({ title: 'Wrath of the Druids' }).success).toBe(false)
  })

  it('defaults a DLC to type "dlc", not completed, and rejects unknown types', () => {
    const parsed = dlcSchema.parse({ title: 'The Siege of Paris', game_id: 'g1' })
    expect(parsed.dlc_type).toBe('dlc')
    expect(parsed.completed).toBe(false)
    expect(dlcSchema.parse({ title: 'A', game_id: 'g1', dlc_type: 'expansion' }).dlc_type).toBe('expansion')
    expect(dlcSchema.safeParse({ title: 'A', game_id: 'g1', dlc_type: 'season' }).success).toBe(false)
  })

  it('trims the title and turns blank optional text into undefined', () => {
    const result = gameSchema.parse({ title: '  Hades  ', developer: '  ', description: ' about ' })
    expect(result.title).toBe('Hades')
    expect(result.developer).toBeUndefined()
    expect(result.description).toBe('about')
  })

  it('defaults id arrays to empty', () => {
    const result = gameSchema.parse({ title: 'Hades' })
    expect(result.tagIds).toEqual([])
    expect(result.genreIds).toEqual([])
  })

  it('treats empty condition as unset and rejects unknown conditions', () => {
    expect(gameSchema.parse({ title: 'A', condition: '' }).condition).toBeUndefined()
    expect(gameSchema.safeParse({ title: 'A', condition: 'shiny' }).success).toBe(false)
  })

  it('coerces numeric strings and rejects invalid page counts', () => {
    expect(artbookSchema.parse({ title: 'A', page_count: '240' }).page_count).toBe(240)
    expect(artbookSchema.parse({ title: 'A', page_count: '' }).page_count).toBeUndefined()
    expect(artbookSchema.safeParse({ title: 'A', page_count: '1.5' }).success).toBe(false)
    expect(artbookSchema.safeParse({ title: 'A', page_count: '0' }).success).toBe(false)
    expect(artbookSchema.safeParse({ title: 'A', page_count: 'abc' }).success).toBe(false)
  })

  it('allows decimal figure heights but only positive', () => {
    expect(figureSchema.parse({ title: 'A', height_cm: '23.5' }).height_cm).toBe(23.5)
    expect(figureSchema.safeParse({ title: 'A', height_cm: '-1' }).success).toBe(false)
  })
})
