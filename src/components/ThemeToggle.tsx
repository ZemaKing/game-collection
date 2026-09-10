import { Check, Monitor, Moon, Sun } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { useLocale } from '@/hooks/useLocale'
import { useTheme, type Theme } from '@/hooks/useTheme'
import type { TranslationKey } from '@/lib/i18n'

const OPTIONS: { value: Theme; labelKey: TranslationKey; icon: typeof Sun }[] = [
  { value: 'light', labelKey: 'theme.light', icon: Sun },
  { value: 'dark', labelKey: 'theme.dark', icon: Moon },
  { value: 'system', labelKey: 'theme.system', icon: Monitor },
]

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const { t } = useLocale()
  const ActiveIcon = resolvedTheme === 'dark' ? Moon : Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('theme.change')}
          className="flex size-10 items-center justify-center rounded-full border border-border bg-surface text-text hover:bg-card-hover"
        >
          <ActiveIcon size={18} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OPTIONS.map(({ value, labelKey, icon: Icon }) => (
          <DropdownMenuItem key={value} onSelect={() => setTheme(value)}>
            <Icon size={16} />
            <span className="flex-1">{t(labelKey)}</span>
            {theme === value && <Check size={16} />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
