import { Check, Languages } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { useLocale } from '@/hooks/useLocale'
import { locales } from '@/lib/i18n'

export function LocaleToggle() {
  const { locale, setLocale, t } = useLocale()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('locale.change')}
          className="flex size-10 items-center justify-center rounded-full border border-border bg-surface text-text hover:bg-card-hover"
        >
          <Languages size={18} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map(({ value, label }) => (
          <DropdownMenuItem key={value} onSelect={() => setLocale(value)}>
            <span className="flex-1">{label}</span>
            {locale === value && <Check size={16} />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
