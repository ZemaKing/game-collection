import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useLocale } from '@/hooks/useLocale'

/** Persistent app-wide notice while the browser reports no network connectivity. */
export function OfflineBanner() {
  const { t } = useLocale()
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-danger-solid px-4 py-2 text-sm font-medium text-white">
      <WifiOff size={14} />
      {t('common.offline')}
    </div>
  )
}
