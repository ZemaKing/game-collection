import * as RadixDialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ComponentType } from 'react'
import { NavLink } from 'react-router-dom'
import { ITEM_TYPE_COLORS } from '@/features/items/constants'
import type { ItemType } from '@/features/items/types'
import { useRef } from 'react'
import { useLocale } from '@/hooks/useLocale'
import { focusMainOnClose, restoreFocusOnClose } from '@/lib/dialogFocus'
import { usePlatformNavItems } from '@/hooks/usePlatformNavItems'
import {
  collectionNavItems,
  primaryNavItems,
} from '@/lib/navigation'

interface MobileNavSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function NavRow({
  label,
  to,
  icon: Icon,
  itemType,
  onNavigate,
}: {
  label: string
  to: string
  icon: ComponentType<{ size?: number; className?: string }>
  itemType?: ItemType
  onNavigate: () => void
}) {
  const iconColor = itemType ? ITEM_TYPE_COLORS[itemType].icon : ''
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive ? 'bg-accent-solid text-accent-fg' : 'text-muted hover:bg-card-hover hover:text-text'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18} className={`shrink-0 ${!isActive && iconColor}`} />
          {label}
        </>
      )}
    </NavLink>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="sidebar-group-label px-3 pt-4 pb-1 text-muted">{children}</p>
  )
}

export function MobileNavSheet({ open, onOpenChange }: MobileNavSheetProps) {
  const { t } = useLocale()
  const platformNavItems = usePlatformNavItems()
  // Following a nav link closes the sheet; then focus belongs on the new page, not the menu button.
  const navigatedRef = useRef(false)
  const close = () => {
    navigatedRef.current = true
    onOpenChange(false)
  }

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <RadixDialog.Content
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            const navigated = navigatedRef.current
            navigatedRef.current = false
            if (navigated) focusMainOnClose(event)
            else restoreFocusOnClose(event)
          }}
          className="fixed inset-y-0 left-0 z-50 flex w-full max-w-xs flex-col overflow-y-auto bg-surface p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] text-text shadow-xl outline-none">
          <div className="flex shrink-0 items-center justify-between px-1 py-2">
            <RadixDialog.Title className="sidebar-brand text-text">
              {t('sidebar.title')}
            </RadixDialog.Title>
            <RadixDialog.Close aria-label={t('a11y.close')} className="flex size-10 items-center justify-center rounded-full text-muted hover:text-text">
              <X size={20} />
            </RadixDialog.Close>
          </div>

          <nav aria-label={t('a11y.primaryNav')} className="flex flex-1 flex-col gap-1">
            <div className="flex flex-col gap-1">
              {primaryNavItems.map((item) => (
                <NavRow
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  label={t(item.labelKey)}
                  itemType={item.itemType}
                  onNavigate={close}
                />
              ))}
            </div>

            <SectionLabel>{t('nav.platformsSection')}</SectionLabel>
            <div className="flex flex-col gap-1">
              {platformNavItems.map((item) => (
                <NavRow key={item.to} to={item.to} icon={item.icon} label={item.label} onNavigate={close} />
              ))}
            </div>

            <SectionLabel>{t('nav.collectionSection')}</SectionLabel>
            <div className="flex flex-col gap-1">
              {collectionNavItems.map((item) => (
                <NavRow
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  label={t(item.labelKey)}
                  onNavigate={close}
                />
              ))}
            </div>
          </nav>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
