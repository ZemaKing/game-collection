import { Clock, Gamepad2, LayoutDashboard, Plus, User } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'
import type { TranslationKey } from '@/lib/i18n'

const tabs = [
  { labelKey: 'nav.dashboard', to: '/', icon: LayoutDashboard },
  { labelKey: 'nav.games', to: '/games', icon: Gamepad2 },
  { labelKey: 'bottomTab.recentlyAdded', to: '/recently-added', icon: Clock },
  { labelKey: 'bottomTab.profile', to: '/profile', icon: User },
] satisfies { labelKey: TranslationKey; to: string; icon: typeof LayoutDashboard }[]

export function BottomTabBar() {
  const { t } = useLocale()
  const { user } = useAuth()
  const { pathname } = useLocation()

  // Add/Edit item forms render their own mobile Back/Next/Save bar fixed to
  // the same bottom edge (`ItemForm.tsx`); showing both at once would stack
  // two bottom bars and hide the form's own actions behind this one.
  const isItemFormRoute = pathname === '/items/new' || pathname.endsWith('/edit')
  if (isItemFormRoute) return null

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around gap-1 border-t border-border bg-surface px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden">
      <TabLink {...tabs[0]} />
      <TabLink {...tabs[1]} />

      {user && (
        <Link
          to="/items/new"
          aria-label={t('bottomTab.addNewItem')}
          className="-mt-6 flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg"
        >
          <Plus size={22} />
        </Link>
      )}

      <TabLink {...tabs[2]} />
      <TabLink {...tabs[3]} />
    </nav>
  )
}

function TabLink({
  labelKey,
  to,
  icon: Icon,
}: (typeof tabs)[number]) {
  const { t } = useLocale()
  const label = t(labelKey)
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex min-w-0 flex-1 flex-col items-center justify-start gap-0.5 self-stretch rounded-lg px-1 py-1 text-xs font-medium ${
          isActive ? 'text-accent' : 'text-muted'
        }`
      }
    >
      <Icon size={20} />
      <span className="max-w-full text-center leading-tight break-words">{label}</span>
    </NavLink>
  )
}
