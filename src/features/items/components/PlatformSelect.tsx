import { ChevronDown, Gamepad2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu'
import { PLATFORM_ICONS } from '@/features/items/constants'
import type { Platform } from '@/features/items/types'

interface PlatformSelectProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  options: Platform[]
  placeholder?: string
  error?: string
  required?: boolean
}

/**
 * Icon-aware alternative to the plain `<Select>` for platform pickers —
 * native `<select>`/`<option>` can't render brand glyphs, so this uses the
 * same `PLATFORM_ICONS` map (keyed by slug) already used in the sidebar and
 * on item cards, via the existing Radix `DropdownMenu` wrapper.
 */
export function PlatformSelect({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  error,
  required,
}: PlatformSelectProps) {
  const selected = options.find((option) => option.id === value)
  const SelectedIcon = selected ? PLATFORM_ICONS[selected.slug] : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-label font-semibold text-text">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            name={name}
            data-field={name}
            aria-invalid={error ? true : undefined}
            className={`flex items-center justify-between gap-2 rounded-md border bg-bg px-3 py-2 text-left text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent ${error ? 'border-danger' : 'border-border'}`}
          >
            <span className="flex min-w-0 items-center gap-2">
              {selected ? (
                SelectedIcon ? (
                  <SelectedIcon size={16} className="shrink-0 text-muted" />
                ) : (
                  <Gamepad2 size={16} className="shrink-0 text-muted" />
                )
              ) : null}
              <span className={`truncate ${selected ? '' : 'text-muted'}`}>
                {selected ? selected.name : (placeholder ?? '')}
              </span>
            </span>
            <ChevronDown size={16} className="shrink-0 text-muted" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-64 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto"
        >
          <DropdownMenuItem onSelect={() => onChange('')}>
            <span className="text-muted">{placeholder ?? ''}</span>
          </DropdownMenuItem>
          {options.map((option) => {
            const Icon = PLATFORM_ICONS[option.slug]
            return (
              <DropdownMenuItem key={option.id} onSelect={() => onChange(option.id)}>
                {Icon && <Icon size={16} className="shrink-0 text-muted" />}
                {option.name}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  )
}
