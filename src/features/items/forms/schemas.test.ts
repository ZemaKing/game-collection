import { describe, expect, it } from 'vitest'
import { ITEM_SCHEMAS, artbookSchema, figureSchema, gameSchema } from '@/features/items/forms/schemas'

describe('item form schemas', () => {
  it('requires a non-blank title for every item type', () => {
    for (const schema of Object.values(ITEM_SCHEMAS)) {
      expect(schema.safeParse({ title: '   ' }).success).toBe(false)
      expect(schema.safeParse({ title: 'Ok' }).success).toBe(true)
    }
  })

  it('trims the title and turns blank optional text into undefined', () => {
    const result = gameSchema.parse({ title: '  Hades  ', developer: '  ', notes: ' note ' })
    expect(result.title).toBe('Hades')
    expect(result.developer).toBeUndefined()
    expect(result.notes).toBe('note')
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
