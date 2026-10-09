import { describe, expect, it } from 'vitest'
import { duplicateLookup } from '@/features/items/duplicates'

describe('duplicateLookup', () => {
  it('matches the trimmed title within the same item type', () => {
    expect(duplicateLookup('game', '  Halo 3  ')).toEqual({
      itemType: 'game',
      titlePattern: 'Halo 3',
      parentGameId: null,
    })
  })

  it('has nothing to check for a blank title', () => {
    expect(duplicateLookup('game', '')).toBeNull()
    expect(duplicateLookup('figure', '   ')).toBeNull()
  })

  it('escapes LIKE wildcards so they match literally', () => {
    expect(
      duplicateLookup('stuff', '100% Orange_Juice \\o/')?.titlePattern,
    ).toBe('100\\% Orange\\_Juice \\\\o/')
  })

  it('scopes a DLC to its base game', () => {
    expect(duplicateLookup('dlc', 'Season Pass', 'game-1')?.parentGameId).toBe(
      'game-1',
    )
    expect(duplicateLookup('dlc', 'Season Pass')?.parentGameId).toBeNull()
  })

  it('ignores a base game for other item types', () => {
    expect(
      duplicateLookup('steelbook', 'Halo', 'game-1')?.parentGameId,
    ).toBeNull()
  })
})
