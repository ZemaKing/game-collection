import { Moon, Sun } from 'lucide-react'
import { useLocale } from '@/hooks/useLocale'
import { useTheme } from '@/hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const { t } = useLocale()
  const ActiveIcon = theme === 'dark' ? Moon : Sun
  const nextLabel = t(theme === 'dark' ? 'theme.light' : 'theme.dark')

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`${t('theme.change')}: ${nextLabel}`}
      title={nextLabel}
      className="flex size-10 items-center justify-center rounded-full border border-border bg-surface text-text hover:bg-card-hover"
    >
      <ActiveIcon size={18} />
    </button>
  )
}
