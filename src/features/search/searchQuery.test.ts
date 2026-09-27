import { describe, expect, it } from 'vitest'
import { searchTokens, tokenPattern } from '@/features/search/searchQuery'

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
