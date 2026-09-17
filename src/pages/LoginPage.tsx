import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate, type Location } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'

function LoginPage() {
  const { t } = useLocale()
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? '/'

  if (user) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error: signInError } = await signIn(email, password)
    setSubmitting(false)
    if (signInError) {
      setError(signInError)
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text">{t('auth.loginTitle')}</h1>
        <p className="mt-1 text-sm text-muted">{t('auth.loginSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-text">
            {t('auth.email')}
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-text">
            {t('auth.password')}
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">
            {t('auth.loginError')}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? t('auth.signingIn') : t('auth.signIn')}
        </button>
      </form>
    </div>
  )
}

export default LoginPage
