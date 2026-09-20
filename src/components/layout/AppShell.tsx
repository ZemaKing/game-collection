import { Suspense, useRef, type MouseEvent } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { Spinner } from '@/components/ui/Spinner'
import { useLocale } from '@/hooks/useLocale'
import { usePageA11y } from '@/hooks/usePageA11y'

export function AppShell() {
  const { t } = useLocale()
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const announcement = usePageA11y(mainRef)
  // Add/Edit forms render their own sticky mobile action bar in place of the bottom tab bar.
  const isItemFormRoute = location.pathname === '/items/new' || location.pathname.endsWith('/edit')

  // A plain `#main-content` link would add a hash to the URL; focus the landmark directly instead.
  function skipToContent(event: MouseEvent) {
    event.preventDefault()
    mainRef.current?.focus()
  }

  return (
    <div className="flex h-svh bg-bg pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] text-text">
      <a
        href="#main-content"
        onClick={skipToContent}
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-accent-solid focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-accent-fg focus:shadow-lg"
      >
        {t('a11y.skipToContent')}
      </a>
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <OfflineBanner />
        <Topbar />
        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className={`min-h-0 flex-1 overflow-y-auto p-4 outline-none md:p-6 md:pb-6 ${isItemFormRoute ? '' : 'pb-[calc(5rem+env(safe-area-inset-bottom))]'}`}
        >
          <Suspense
            fallback={
              <div className="flex justify-center py-16 text-muted">
                <Spinner size={24} />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
      <BottomTabBar />
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </div>
  )
}
