import { describe, expect, it } from 'vitest'
import { escapeLikePattern } from '@/features/items/likePattern'

describe('escapeLikePattern', () => {
  it('leaves ordinary text alone', () => {
    expect(escapeLikePattern('The Witcher 3: Wild Hunt')).toBe('The Witcher 3: Wild Hunt')
  })

  it('escapes % and _ so they match literally', () => {
    expect(escapeLikePattern('100% Orange Juice')).toBe('100\\% Orange Juice')
    expect(escapeLikePattern('Half_Life')).toBe('Half\\_Life')
  })

  it('escapes backslashes without doubling the ones it adds', () => {
    expect(escapeLikePattern('a\\b')).toBe('a\\\\b')
    expect(escapeLikePattern('\\%')).toBe('\\\\\\%')
  })
})
