import { Gamepad2, Plus } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import {
  collectionNavItems,
  platformNavItems,
  primaryNavItems,
  type NavItem,
} from '@/lib/navigation'

function NavRow({ label, to, icon: Icon }: NavItem) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors xl:justify-start justify-center ${
          isActive
            ? 'bg-accent text-accent-fg'
            : 'text-muted hover:bg-card-hover hover:text-text'
        }`
      }
      title={label}
    >
      <Icon size={18} className="shrink-0" />
      <span className="hidden xl:inline">{label}</span>
    </NavLink>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="hidden px-3 pt-4 pb-1 text-xs font-semibold tracking-wider text-muted xl:block">
      {children}
    </p>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden w-20 shrink-0 flex-col border-r border-border bg-surface p-3 md:flex xl:w-64">
      <div className="flex items-center justify-center gap-2 px-1 py-3 xl:justify-start">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-fg">
          <Gamepad2 size={18} />
        </div>
        <span className="hidden text-sm font-bold tracking-wide text-text xl:inline">
          MY COLLECTION
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        <div className="flex flex-col gap-1">
          {primaryNavItems.map((item) => (
            <NavRow key={item.to} {...item} />
          ))}
        </div>

        <SectionLabel>Platforms</SectionLabel>
        <div className="flex flex-col gap-1">
          {platformNavItems.map((item) => (
            <NavRow key={item.to} {...item} />
          ))}
        </div>

        <SectionLabel>Collection</SectionLabel>
        <div className="flex flex-col gap-1">
          {collectionNavItems.map((item) => (
            <NavRow key={item.to} {...item} />
          ))}
        </div>
      </nav>

      <button
        type="button"
        title="Add New Item"
        className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-fg hover:bg-accent-hover"
      >
        <Plus size={18} />
        <span className="hidden xl:inline">Add New Item</span>
      </button>
    </aside>
  )
}
