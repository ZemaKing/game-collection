import { describe, expect, it } from 'vitest'
import {
  calculateCompleteness,
  completenessFactsFromDetail,
  completenessFactsFromRow,
  type CompletenessFacts,
} from '@/features/items/completeness'
import type { ItemDetail } from '@/features/items/detailTypes'
import type { AllItemRow, ItemType } from '@/features/items/types'

const EMPTY_FACTS: CompletenessFacts = {
  hasSubtitle: false,
  hasPlatform: false,
  hasReleaseDate: false,
  hasCollectionDate: false,
  hasCondition: false,
  hasDescription: false,
  hasCoverImage: false,
}

const FULL_FACTS: CompletenessFacts = {
  hasSubtitle: true,
  hasPlatform: true,
  hasReleaseDate: true,
  hasCollectionDate: true,
  hasCondition: true,
  hasDescription: true,
  hasCoverImage: true,
}

const PLATFORM_TYPES: ItemType[] = ['game', 'special_edition', 'steelbook']
const NO_PLATFORM_TYPES: ItemType[] = ['artbook', 'figure', 'stuff']
const ALL_TYPES: ItemType[] = [...PLATFORM_TYPES, ...NO_PLATFORM_TYPES]

describe('calculateCompleteness', () => {
  it('is 0% when every applicable field is missing, for every item type', () => {
    for (const itemType of ALL_TYPES) {
      expect(calculateCompleteness(itemType, EMPTY_FACTS).percent).toBe(0)
    }
  })

  it('is 100% when every applicable field is present, for every item type', () => {
    for (const itemType of ALL_TYPES) {
      expect(calculateCompleteness(itemType, FULL_FACTS).percent).toBe(100)
    }
  })

  it('ignores platform for types that never have them', () => {
    const facts: CompletenessFacts = {
      ...EMPTY_FACTS,
      hasSubtitle: true,
      hasReleaseDate: true,
      hasCollectionDate: true,
      hasCondition: true,
      hasDescription: true,
      hasCoverImage: true,
    }
    for (const itemType of NO_PLATFORM_TYPES) {
      const result = calculateCompleteness(itemType, facts)
      expect(result.total).toBe(6)
      expect(result.percent).toBe(100)
    }
  })

  it('counts platform as applicable for game/special_edition/steelbook', () => {
    for (const itemType of PLATFORM_TYPES) {
      expect(calculateCompleteness(itemType, { ...EMPTY_FACTS, hasPlatform: true }).filled).toBe(1)
    }
  })

  it('scores a steelbook on platform, dates, condition and cover only', () => {
    expect(calculateCompleteness('steelbook', EMPTY_FACTS).total).toBe(5)
    expect(
      calculateCompleteness('steelbook', { ...EMPTY_FACTS, hasSubtitle: true, hasDescription: true }).percent,
    ).toBe(0)
    expect(calculateCompleteness('steelbook', FULL_FACTS).percent).toBe(100)
  })

  it('computes a partial percentage deterministically', () => {
    const halfGameFacts: CompletenessFacts = {
      ...EMPTY_FACTS,
      hasSubtitle: true,
      hasPlatform: true,
          hasReleaseDate: true,
    }
    // 3 of 7 applicable fields for `game`.
    expect(calculateCompleteness('game', halfGameFacts)).toEqual({ percent: 43, filled: 3, total: 7 })
  })
})

describe('DLC completeness', () => {
  it('ignores subtitle and platform, which a DLC only inherits from its base game', () => {
    expect(calculateCompleteness('dlc', EMPTY_FACTS)).toEqual({ percent: 0, filled: 0, total: 5 })
    expect(calculateCompleteness('dlc', { ...EMPTY_FACTS, hasSubtitle: true, hasPlatform: true }).percent).toBe(0)
    expect(calculateCompleteness('dlc', FULL_FACTS).percent).toBe(100)
  })
})

describe('completenessFactsFromRow', () => {
  function row(overrides: Partial<AllItemRow>): AllItemRow {
    return {
      id: '1',
      item_type: 'game',
      title: 'Test',
      subtitle: null,
      platform_id: null,
      release_date: null,
      collection_date: null,
      condition: null,
      description: null,
      cover_image_path: null,
      genre_slug: null,
      genre_name: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      ...overrides,
    }
  }

  it('maps an empty row to all-false facts', () => {
    expect(completenessFactsFromRow(row({}))).toEqual(EMPTY_FACTS)
  })

  it('maps a fully-populated row to all-true facts', () => {
    expect(
      completenessFactsFromRow(
        row({
          subtitle: 'Some Studio',
          platform_id: 'p1',
          release_date: '2026-01-01',
          collection_date: '2026-02-01',
          condition: 'mint',
          description: 'A description',
          cover_image_path: 'game/1/cover.jpg',
        }),
      ),
    ).toEqual(FULL_FACTS)
  })
})

describe('completenessFactsFromDetail', () => {
  function detail(overrides: Partial<ItemDetail>): ItemDetail {
    return {
      id: '1',
      item_type: 'game',
      title: 'Test',
      description: null,
      release_date: null,
      collection_date: null,
      condition: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      platform: null,
      genres: [],
      developer: null,
      publisher: null,
      completed: false,
      edition_name: null,
      game_title: null,
      page_count: null,
      isbn: null,
      language: null,
      manufacturer: null,
      character_name: null,
      scale: null,
      material: null,
      height_cm: null,
      category: null,
      base_game_id: null,
      dlc_type: null,
      ...overrides,
    }
  }

  it('reads the developer field as the subtitle proxy for games', () => {
    expect(completenessFactsFromDetail(detail({ item_type: 'game', developer: 'Motive' }), false).hasSubtitle).toBe(
      true,
    )
  })

  it('reads the edition_name field as the subtitle proxy for special editions', () => {
    expect(
      completenessFactsFromDetail(detail({ item_type: 'special_edition', edition_name: 'Deluxe' }), false)
        .hasSubtitle,
    ).toBe(true)
  })

  it('reads publisher/manufacturer/category as the subtitle proxy for artbook/figure/stuff', () => {
    expect(
      completenessFactsFromDetail(detail({ item_type: 'artbook', publisher: 'Prima' }), false).hasSubtitle,
    ).toBe(true)
    expect(
      completenessFactsFromDetail(detail({ item_type: 'figure', manufacturer: 'Kotobukiya' }), false).hasSubtitle,
    ).toBe(true)
    expect(
      completenessFactsFromDetail(detail({ item_type: 'stuff', category: 'Merch' }), false).hasSubtitle,
    ).toBe(true)
  })

  it('takes cover-image presence from the passed-in flag, not the detail row', () => {
    expect(completenessFactsFromDetail(detail({}), true).hasCoverImage).toBe(true)
    expect(completenessFactsFromDetail(detail({}), false).hasCoverImage).toBe(false)
  })
})
