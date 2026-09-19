import { Outlet, useLocation } from 'react-router-dom'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

export function AppShell() {
  const location = useLocation()
  // Add/Edit forms render their own sticky mobile action bar in place of the bottom tab bar.
  const isItemFormRoute = location.pathname === '/items/new' || location.pathname.endsWith('/edit')

  return (
    <div className="flex h-svh bg-bg pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] text-text">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <OfflineBanner />
        <Topbar />
        <main className={`min-h-0 flex-1 overflow-y-auto p-4 md:p-6 md:pb-6 ${isItemFormRoute ? '' : 'pb-[calc(5rem+env(safe-area-inset-bottom))]'}`}>
          <Outlet />
        </main>
      </div>
      <BottomTabBar />
    </div>
  )
}
