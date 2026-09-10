import { Search } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

export function Topbar() {
  return (
    <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 md:px-6">
      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          disabled
          placeholder="Search games, editions, platforms..."
          className="w-full rounded-full border border-border bg-bg py-2 pr-16 pl-9 text-sm text-text placeholder:text-muted focus:outline-none disabled:cursor-not-allowed"
        />
        <kbd className="absolute top-1/2 right-3 -translate-y-1/2 rounded border border-border px-1.5 py-0.5 text-xs text-muted">
          Ctrl K
        </kbd>
      </div>

      <button
        type="button"
        aria-label="Search"
        className="flex size-10 items-center justify-center rounded-full border border-border bg-bg text-text sm:hidden"
      >
        <Search size={18} />
      </button>

      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        <div
          className="flex size-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-fg"
          title="Collector"
        >
          C
        </div>
      </div>
    </header>
  )
}
