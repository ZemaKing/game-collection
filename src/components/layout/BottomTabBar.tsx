import { Heart, Home, Plus, Search, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const tabs = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Search', to: '/search', icon: Search },
  { label: 'Wishlist', to: '/wishlist', icon: Heart },
  { label: 'Profile', to: '/profile', icon: User },
]

export function BottomTabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-surface px-2 py-2 md:hidden">
      <TabLink {...tabs[0]} />
      <TabLink {...tabs[1]} />

      <button
        type="button"
        aria-label="Add New Item"
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
  label,
  to,
  icon: Icon,
}: (typeof tabs)[number]) {
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
