import { Menu, Search, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { AccountMenu } from '@/components/AccountMenu'
import { LocaleToggle } from '@/components/LocaleToggle'
import { ThemeToggle } from '@/components/ThemeToggle'
import { MobileNavSheet } from '@/components/layout/MobileNavSheet'
import { SearchDialog } from '@/features/search/components/SearchDialog'
import { useLocale } from '@/hooks/useLocale'

export function Topbar() {
  const { t } = useLocale()
  const [searchOpen, setSearchOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <header className="flex items-center gap-2 border-b border-border bg-surface px-4 py-3 sm:gap-3 md:px-6">
      <button
        type="button"
        onClick={() => setNavOpen(true)}
        aria-label={t('topbar.menu')}
        className="flex size-[40px] shrink-0 items-center justify-center rounded-full border border-border bg-bg text-text md:hidden"
      >
        <Menu size={18} />
      </button>

      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          readOnly
          onClick={() => setSearchOpen(true)}
          onFocus={() => setSearchOpen(true)}
          placeholder={t('topbar.searchPlaceholder')}
          className="w-full cursor-pointer rounded-full border border-border bg-bg py-2 pr-16 pl-9 text-sm text-text placeholder:text-muted focus:outline-none"
        />
        <kbd className="absolute top-1/2 right-3 -translate-y-1/2 rounded border border-border px-1.5 py-0.5 text-xs text-muted">
          Ctrl K
        </kbd>
      </div>

      <Link
        to="/search"
        aria-label={t('topbar.search')}
        className="flex size-[40px] shrink-0 items-center justify-center rounded-full border border-border bg-bg text-text sm:hidden"
      >
        <Search size={18} />
      </Link>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <LocaleToggle />
        <ThemeToggle />
        <NavLink
          to="/settings"
          aria-label={t('nav.settings')}
          title={t('nav.settings')}
          className={({ isActive }) =>
            `flex size-[40px] shrink-0 items-center justify-center rounded-full border border-border text-text hover:bg-card-hover ${
              isActive ? 'bg-accent text-accent-fg hover:bg-accent' : 'bg-surface'
            }`
          }
        >
          <Settings size={18} />
        </NavLink>
        <AccountMenu />
      </div>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <MobileNavSheet open={navOpen} onOpenChange={setNavOpen} />
    </header>
  )
}
