import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { LocaleContext } from '@/hooks/useLocale'
import { translate, type Locale } from '@/lib/i18n'

const STORAGE_KEY = 'locale'
const DEFAULT_LOCALE: Locale = 'sr'

function getStoredLocale(): Locale {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'sr' || stored === 'en' ? stored : DEFAULT_LOCALE
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(getStoredLocale)

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale)
  }, [locale])

  const t = useCallback(
    (key: Parameters<typeof translate>[1], vars?: Record<string, string>) =>
      translate(locale, key, vars),
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t])

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}
