import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LocaleToggle } from '@/components/LocaleToggle'
import { ThemeToggle } from '@/components/ThemeToggle'
import { SearchDialog } from '@/features/search/components/SearchDialog'
import { useLocale } from '@/hooks/useLocale'

export function Topbar() {
  const { t } = useLocale()
  const [searchOpen, setSearchOpen] = useState(false)

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
    <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 md:px-6">
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
        className="flex size-10 items-center justify-center rounded-full border border-border bg-bg text-text sm:hidden"
      >
        <Search size={18} />
      </Link>

      <div className="ml-auto flex items-center gap-3">
        <LocaleToggle />
        <ThemeToggle />
        <div
          className="flex size-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-fg"
          title={t('topbar.collector')}
        >
          C
        </div>
      </div>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  )
}
