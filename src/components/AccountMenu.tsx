import { LogIn, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'

export function AccountMenu() {
  const { t } = useLocale()
  const { user, signOut } = useAuth()

  if (!user) {
    return (
      <Link
        to="/login"
        aria-label={t('auth.signIn')}
        title={t('auth.signIn')}
        className="flex size-10 items-center justify-center rounded-full border border-border bg-surface text-text hover:bg-card-hover"
      >
        <LogIn size={18} />
      </Link>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={t('topbar.collector')}
          className="flex size-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-fg"
        >
          C
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => signOut()}>
          <LogOut size={16} />
          <span className="flex-1">{t('auth.signOut')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
