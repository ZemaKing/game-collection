import { useCallback, useEffect, useMemo, type ReactNode } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { LocaleContext } from '@/hooks/useLocale'
import { translate, type Locale } from '@/lib/i18n'

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useSettings()
  const locale = settings.locale

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((next: Locale) => updateSettings({ locale: next }), [updateSettings])

  const t = useCallback(
    (key: Parameters<typeof translate>[1], vars?: Record<string, string>) =>
      translate(locale, key, vars),
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}
