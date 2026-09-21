import { ChevronRight, Plus } from 'lucide-react'
import type { ComponentType } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ITEM_TYPE_COLORS } from '@/features/items/constants'
import type { ItemType } from '@/features/items/types'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'
import { usePlatformNavItems } from '@/hooks/usePlatformNavItems'
import {
  collectionNavItems,
  primaryNavItems,
} from '@/lib/navigation'

function NavRow({
  label,
  to,
  icon: Icon,
  itemType,
}: {
  label: string
  to: string
  icon: ComponentType<{ size?: number; className?: string }>
  itemType?: ItemType
}) {
  const iconColor = itemType ? ITEM_TYPE_COLORS[itemType].icon : ''
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors xl:justify-start justify-center ${
          isActive
            ? 'bg-accent-solid text-accent-fg'
            : 'text-muted hover:bg-card-hover hover:text-text'
        }`
      }
      title={label}
      aria-label={label}
    >
      {({ isActive }) => (
        <>
          <Icon size={18} className={`shrink-0 ${!isActive && iconColor}`} />
          <span className="hidden xl:inline">{label}</span>
        </>
      )}
    </NavLink>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="sidebar-group-label hidden px-3 pt-4 pb-1 text-muted xl:block">
      {children}
    </p>
  )
}

export function Sidebar() {
  const { t } = useLocale()
  const platformNavItems = usePlatformNavItems()
  const { user } = useAuth()

  return (
    <div className="hidden w-20 shrink-0 flex-col border-r border-border bg-surface p-3 md:flex xl:w-64">
      <div className="flex items-center justify-center gap-2 px-1 py-3 xl:justify-start">
        <img src="/favicon.svg" alt="" className="size-9 shrink-0 object-contain" />
        <span className="sidebar-brand hidden text-text xl:inline">
          {t('sidebar.title')}
        </span>
      </div>

      <nav aria-label={t('a11y.primaryNav')} className="flex flex-1 flex-col gap-1 overflow-y-auto">
        <div className="flex flex-col gap-1">
          {primaryNavItems.map((item) => (
            <NavRow
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={t(item.labelKey)}
              itemType={item.itemType}
            />
          ))}
        </div>

        <SectionLabel>{t('nav.platformsSection')}</SectionLabel>
        <div className="flex flex-col gap-1">
          {platformNavItems.map((item) => (
            <NavRow key={item.to} to={item.to} icon={item.icon} label={item.label} />
          ))}
        </div>

        <SectionLabel>{t('nav.collectionSection')}</SectionLabel>
        <div className="flex flex-col gap-1">
          {collectionNavItems.map((item) => (
            <NavRow key={item.to} to={item.to} icon={item.icon} label={t(item.labelKey)} />
          ))}
        </div>
      </nav>

      {user && (
        <Link
          to="/items/new"
          title={t('sidebar.addNewItem')}
          aria-label={t('sidebar.addNewItem')}
          className="group mt-3 flex items-center justify-center gap-3 rounded-xl border border-accent px-3 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent xl:justify-start"
        >
          <Plus size={20} className="shrink-0 text-accent" />
          <span className="hidden flex-1 xl:inline">{t('sidebar.addNewItem')}</span>
          <ChevronRight
            size={16}
            className="hidden shrink-0 text-muted transition-transform group-hover:translate-x-0.5 xl:block"
          />
        </Link>
      )}
    </div>
  )
}
