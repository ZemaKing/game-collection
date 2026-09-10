import { useLocation } from 'react-router-dom'
import { useLocale } from '@/hooks/useLocale'

function ComingSoonPage() {
  const location = useLocation()
  const { t } = useLocale()

  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-24 text-center">
      <h1 className="text-lg font-semibold text-text">
        {t('comingSoon.title')}
      </h1>
      <p className="text-sm text-muted">
        <code>{location.pathname}</code> {t('comingSoon.subtitleSuffix')}
      </p>
    </div>
  )
}

export default ComingSoonPage
