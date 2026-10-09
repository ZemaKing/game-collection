import { describe, expect, it } from 'vitest'
import { mergeSearchResults, searchTokens, tokenPattern } from '@/features/search/searchQuery'

describe('searchTokens', () => {
  it('lowercases and splits on whitespace', () => {
    expect(searchTokens('  NBA   Playgrounds ')).toEqual(['nba', 'playgrounds'])
  })

  it('drops dots and apostrophes inside words', () => {
    expect(searchTokens('F.I.S.T.: Forged')).toEqual(['fist', 'forged'])
    expect(searchTokens("Sid Meier's")).toEqual(['sid', 'meiers'])
    expect(searchTokens('Sid Meier’s')).toEqual(['sid', 'meiers'])
  })

  it('splits on other punctuation', () => {
    expect(searchTokens('Half-Life: Alyx!')).toEqual(['half', 'life', 'alyx'])
    expect(searchTokens('Ratchet & Clank')).toEqual(['ratchet', 'clank'])
  })

  it('strips accents and folds special letters like unaccent', () => {
    expect(searchTokens('Pokémon Épée')).toEqual(['pokemon', 'epee'])
    expect(searchTokens('Đorđe Straße')).toEqual(['dorde', 'strasse'])
  })

  it('keeps numerals as typed (the stored text holds both forms)', () => {
    expect(searchTokens('Civilization VI')).toEqual(['civilization', 'vi'])
    expect(searchTokens('GTA 5')).toEqual(['gta', '5'])
  })

  it('removes duplicate tokens', () => {
    expect(searchTokens('mario mario')).toEqual(['mario'])
  })

  it('returns no tokens for punctuation-only input', () => {
    expect(searchTokens(' .:-! ')).toEqual([])
  })
})

describe('tokenPattern', () => {
  it('wraps the token for a substring ilike', () => {
    expect(tokenPattern('fist')).toBe('%fist%')
  })
})

describe('mergeSearchResults', () => {
  const row = (id: string, source: string) => ({ id, source })

  it('keeps the first occurrence of each id, in list priority order', () => {
    const merged = mergeSearchResults(
      [[row('a', 'title'), row('b', 'title')], [row('b', 'subtitle'), row('c', 'subtitle')], [row('a', 'tag')]],
      10,
    )
    expect(merged).toEqual([row('a', 'title'), row('b', 'title'), row('c', 'subtitle')])
  })

  it('caps the merged list at the limit', () => {
    expect(mergeSearchResults([[row('a', 't'), row('b', 't')], [row('c', 's')]], 2).map((r) => r.id)).toEqual(['a', 'b'])
  })

  it('handles no lists and empty lists', () => {
    expect(mergeSearchResults([], 5)).toEqual([])
    expect(mergeSearchResults([[], []], 5)).toEqual([])
  })
})
