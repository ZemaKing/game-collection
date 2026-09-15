import { Clock, Home, Plus, Search, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useLocale } from '@/hooks/useLocale'
import type { TranslationKey } from '@/lib/i18n'

const tabs = [
  { labelKey: 'bottomTab.home', to: '/', icon: Home },
  { labelKey: 'bottomTab.search', to: '/search', icon: Search },
  { labelKey: 'bottomTab.recentlyAdded', to: '/recently-added', icon: Clock },
  { labelKey: 'bottomTab.profile', to: '/profile', icon: User },
] satisfies { labelKey: TranslationKey; to: string; icon: typeof Home }[]

export function BottomTabBar() {
  const { t } = useLocale()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-surface px-2 py-2 md:hidden">
      <TabLink {...tabs[0]} />
      <TabLink {...tabs[1]} />

      <button
        type="button"
        aria-label={t('bottomTab.addNewItem')}
        className="-mt-6 flex size-12 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg"
      >
        <Plus size={22} />
      </button>

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
        `flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-xs font-medium ${
          isActive ? 'text-accent' : 'text-muted'
        }`
      }
    >
      <Icon size={20} />
      {label}
    </NavLink>
  )
}
