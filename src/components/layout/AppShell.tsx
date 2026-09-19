import { Outlet, useLocation } from 'react-router-dom'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

export function AppShell() {
  const location = useLocation()
  const isCreateItemScreen = location.pathname === '/items/new'

  return (
    <div className="flex h-svh bg-bg text-text">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <OfflineBanner />
        <Topbar />
        <main className={`min-h-0 flex-1 overflow-y-auto p-4 md:p-6 md:pb-6 ${isCreateItemScreen ? '' : 'pb-20'}`}>
          <Outlet />
        </main>
      </div>
      <BottomTabBar />
    </div>
  )
}
