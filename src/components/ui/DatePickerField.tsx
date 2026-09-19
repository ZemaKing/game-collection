import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, type ComponentProps } from 'react'
import { DayPicker } from 'react-day-picker'
import { enGB, srLatn } from 'react-day-picker/locale'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { useLocale } from '@/hooks/useLocale'
import { formatIsoDate, parseIsoDate } from '@/lib/isoDate'

function Chevron({ orientation }: { orientation?: 'up' | 'down' | 'left' | 'right' }) {
  return orientation === 'right' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />
}

const dayPickerClassNames: ComponentProps<typeof DayPicker>['classNames'] = {
  months: 'flex flex-col',
  month: 'flex flex-col gap-3',
  month_caption: 'relative flex h-8 items-center justify-center',
  caption_label: 'text-sm font-semibold text-text',
  dropdowns: 'flex items-center gap-1 text-sm font-semibold text-text',
  dropdown_root: 'relative inline-flex items-center rounded-md hover:bg-card-hover',
  dropdown: 'absolute inset-0 cursor-pointer opacity-0',
  months_dropdown: 'text-text',
  years_dropdown: 'text-text',
  nav: 'absolute inset-x-0 top-0 flex h-8 items-center justify-between',
  button_previous:
    'flex size-7 items-center justify-center rounded-md text-muted outline-none hover:bg-card-hover hover:text-text focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-40',
  button_next:
    'flex size-7 items-center justify-center rounded-md text-muted outline-none hover:bg-card-hover hover:text-text focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-40',
  month_grid: 'mt-1 w-full border-collapse',
  weekdays: '',
  weekday: 'pb-1 text-xs font-medium text-muted',
  week: '',
  day: 'p-0.5 text-center',
  day_button:
    'flex size-8 items-center justify-center rounded-md text-sm text-text outline-none hover:bg-card-hover focus-visible:ring-2 focus-visible:ring-accent',
  today: 'font-semibold text-accent',
  selected: 'rounded-md bg-accent text-accent-fg hover:bg-accent-hover',
  outside: 'text-muted opacity-50',
  disabled: 'pointer-events-none text-muted opacity-40',
  hidden: 'invisible',
}

export interface DatePickerFieldProps {
  /** Visible label above the field. Omit and pass `ariaLabel` for a labelless layout (e.g. filter ranges). */
  label?: string
  ariaLabel?: string
  name: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  minDate?: Date
  maxDate?: Date
}

/**
 * Calendar-based date field styled to match `Input`/`ConditionSelect`, backed
 * by `react-day-picker` inside our `Popover`. Reads/writes plain `YYYY-MM-DD`
 * strings (the format the item form and Supabase `date` columns already use)
 * and parses/formats them from local date parts only, so the displayed day
 * never shifts due to UTC conversion.
 */
export function DatePickerField({
  label,
  ariaLabel,
  name,
  value,
  onChange,
  placeholder,
  disabled,
  required,
  error,
  minDate,
  maxDate,
}: DatePickerFieldProps) {
  const { locale, t } = useLocale()
  const [open, setOpen] = useState(false)
  const selected = parseIsoDate(value)
  const dayPickerLocale = locale === 'sr' ? srLatn : enGB

  const displayValue = selected
    ? new Intl.DateTimeFormat(locale === 'sr' ? 'sr-Latn' : 'en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(selected)
    : ''

  function selectDate(date: Date | undefined) {
    onChange(date ? formatIsoDate(date) : '')
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-label font-semibold text-text">
          {label}
          {required && <span className="text-danger"> *</span>}
        </span>
      )}
      <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            name={name}
            data-field={name}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-label={ariaLabel ?? label}
            className={`flex items-center justify-between gap-2 rounded-md border bg-bg px-3 py-2 text-left text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60 ${error ? 'border-danger' : 'border-border'}`}
          >
            <span className={displayValue ? '' : 'text-muted'}>
              {displayValue || placeholder || t('form.selectDate')}
            </span>
            <CalendarIcon size={16} className="shrink-0 text-muted" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[300px] max-w-[calc(100vw-24px)] p-3">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={selectDate}
            defaultMonth={selected ?? new Date()}
            locale={dayPickerLocale}
            weekStartsOn={1}
            captionLayout="dropdown"
            startMonth={minDate ?? new Date(1970, 0)}
            endMonth={maxDate ?? new Date(new Date().getFullYear() + 1, 11)}
            disabled={[...(minDate ? [{ before: minDate }] : []), ...(maxDate ? [{ after: maxDate }] : [])]}
            showOutsideDays
            classNames={dayPickerClassNames}
            components={{ Chevron }}
          />
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
            <button
              type="button"
              onClick={() => selectDate(new Date())}
              className="text-accent hover:text-accent-hover"
            >
              {t('form.today')}
            </button>
            {!required && (
              <button
                type="button"
                onClick={() => selectDate(undefined)}
                className="text-accent hover:text-accent-hover"
              >
                {t('form.clear')}
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  )
}
