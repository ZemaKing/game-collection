import { describe, expect, it } from 'vitest'
import { translate, translations, type TranslationKey } from '@/lib/i18n'

describe('translations', () => {
  it('has the same keys in every locale', () => {
    const sr = Object.keys(translations.sr).sort()
    const en = Object.keys(translations.en).sort()
    expect(en).toEqual(sr)
  })

  it('has no empty strings', () => {
    for (const locale of ['sr', 'en'] as const) {
      for (const [key, value] of Object.entries(translations[locale])) {
        expect(value, `${locale}:${key}`).not.toBe('')
      }
    }
  })

  it('uses the same {placeholders} in both locales', () => {
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort()
    for (const key of Object.keys(translations.sr) as TranslationKey[]) {
      expect(placeholders(translations.en[key]), key).toEqual(placeholders(translations.sr[key]))
    }
  })
})

describe('translate', () => {
  it('substitutes variables', () => {
    const key = (Object.keys(translations.en) as TranslationKey[]).find((k) => translations.en[k].includes('{'))
    if (!key) return
    const name = translations.en[key].match(/\{(\w+)\}/)![1]
    expect(translate('en', key, { [name]: 'XYZ' })).toContain('XYZ')
  })
})
