import { useEffect, useState } from 'react'
import { useLocale } from '@/hooks/useLocale'
import { checkSupabaseConnection } from '@/lib/supabaseClient'

function HomePage() {
  const { t } = useLocale()
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'unreachable'>(
    'checking',
  )

  useEffect(() => {
    checkSupabaseConnection().then((ok) => setSupabaseStatus(ok ? 'connected' : 'unreachable'))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-text">{t('home.welcome')}</h1>
      <p className="mt-1 text-sm text-muted">{t('home.subtitle')}</p>
      {import.meta.env.DEV && (
        <p className="mt-4 text-xs text-muted">Supabase: {supabaseStatus}</p>
      )}
    </div>
  )
}

export default HomePage
