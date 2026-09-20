import { Check, ChevronDown } from 'lucide-react'
import { FieldError, FieldLabel } from '@/components/ui/FieldParts'
import { triggerA11yProps, useFieldIds } from '@/components/ui/useFieldIds'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu'
import { CONDITION_COLORS, CONDITION_ICONS } from '@/features/items/constants'
import type { ItemCondition } from '@/features/items/types'
import { useLocale } from '@/hooks/useLocale'
import type { TranslationKey } from '@/lib/i18n'

interface ConditionSelectProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  options: ItemCondition[]
  labelKeys: Record<ItemCondition, TranslationKey>
  placeholder?: string
  error?: string
  required?: boolean
}

function ConditionGlyph({ condition }: { condition: ItemCondition }) {
  const Icon = CONDITION_ICONS[condition]
  return (
    <span className={`flex size-6 shrink-0 items-center justify-center rounded-full ${CONDITION_COLORS[condition].badge}`}>
      <Icon size={14} />
    </span>
  )
}

/** Icon-and-color condition picker — same Radix-dropdown pattern as `PlatformSelect`. */
export function ConditionSelect({
  label,
  name,
  value,
  onChange,
  options,
  labelKeys,
  placeholder,
  error,
  required,
}: ConditionSelectProps) {
  const { t } = useLocale()
  const selected = options.find((option) => option === value)
  const ids = useFieldIds()

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
              {selected && <ConditionGlyph condition={selected} />}
              <span className={`truncate ${selected ? '' : 'text-muted'}`}>
                {selected ? t(labelKeys[selected]) : (placeholder ?? '')}
              </span>
            </span>
            <ChevronDown size={16} className="shrink-0 text-muted" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto"
        >
          <DropdownMenuItem onSelect={() => onChange('')}>
            <span className="text-muted">{placeholder ?? ''}</span>
          </DropdownMenuItem>
          {options.map((option) => (
            <DropdownMenuItem key={option} onSelect={() => onChange(option)}>
              <ConditionGlyph condition={option} />
              <span className="flex-1">{t(labelKeys[option])}</span>
              {option === value && <Check size={16} className="shrink-0 text-accent" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {error && <FieldError id={ids.errorId}>{error}</FieldError>}
    </div>
  )
}
