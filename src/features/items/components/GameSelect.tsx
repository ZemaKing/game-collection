import { ChevronDown, Gamepad2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu'
import { FieldError, FieldLabel } from '@/components/ui/FieldParts'
import { triggerA11yProps, useFieldIds } from '@/components/ui/useFieldIds'
import { fetchPlatforms } from '@/features/items/api'
import { PLATFORM_SHORT_LABELS } from '@/features/items/constants'
import { fetchGameOptions, type GameOption } from '@/features/items/dlcApi'
import type { Platform } from '@/features/items/types'
import { useLocale } from '@/hooks/useLocale'

interface GameSelectProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
}

/**
 * Picker for a DLC's base game. Lists every game in the collection (with its
 * platform, since the same title can be owned on several) — a DLC can't be
 * saved without one, so there is deliberately no "none" entry.
 */
export function GameSelect({ label, name, value, onChange, error, required }: GameSelectProps) {
  const { t } = useLocale()
  const ids = useFieldIds()
  const [games, setGames] = useState<GameOption[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchGameOptions(), fetchPlatforms()])
      .then(([gameRows, platformRows]) => {
        if (cancelled) return
        setGames(gameRows)
        setPlatforms(platformRows)
      })
      .catch(() => {
        // The picker just stays empty; saving is still blocked by the "base game required" validation.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const platformLabel = useMemo(() => {
    const byId = new Map(platforms.map((p) => [p.id, (PLATFORM_SHORT_LABELS[p.slug] ?? p.name)]))
    return (game: GameOption) => (game.platform_id ? (byId.get(game.platform_id) ?? null) : null)
  }, [platforms])

  const selected = games.find((game) => game.id === value)
  const placeholder = t('dlc.selectBaseGame')

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel id={ids.labelId} required={required}>
        {label}
      </FieldLabel>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            name={name}
            data-field={name}
            {...triggerA11yProps({ ...ids, error, required })}
            className={`flex items-center justify-between gap-2 rounded-md border bg-bg px-3 py-2 text-left text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent ${error ? 'border-danger' : 'border-input'}`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Gamepad2 size={16} className="shrink-0 text-muted" />
              <span className={`truncate ${selected ? '' : 'text-muted'}`}>
                {selected ? selected.title : placeholder}
              </span>
              {selected && platformLabel(selected) && (
                <span className="shrink-0 text-xs text-muted">{platformLabel(selected)}</span>
              )}
            </span>
            <ChevronDown size={16} className="shrink-0 text-muted" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-64 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto"
        >
          {loaded && games.length === 0 && <p className="px-3 py-2 text-sm text-muted">{t('dlc.noGames')}</p>}
          {games.map((game) => (
            <DropdownMenuItem key={game.id} onSelect={() => onChange(game.id)}>
              <Gamepad2 size={16} className="shrink-0 text-muted" />
              <span className="min-w-0 flex-1 truncate">{game.title}</span>
              {platformLabel(game) && <span className="shrink-0 text-xs text-muted">{platformLabel(game)}</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {error && <FieldError id={ids.errorId}>{error}</FieldError>}
    </div>
  )
}
