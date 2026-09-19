import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { getBrowserStorage, loadSettings } from '@/features/settings/settings'
import { translate, type Locale } from '@/lib/i18n'

// Sits outside the providers (it must survive a provider crash), so it reads
// the stored language directly instead of via `useLocale`.
function getLocale(): Locale {
  return loadSettings(getBrowserStorage()).locale
}

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/** Catches render-time errors anywhere below it so a crash shows a fallback instead of a blank page. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Unhandled render error', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const t = (key: Parameters<typeof translate>[1]) => translate(getLocale(), key)

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-4 text-center">
        <h1 className="text-lg font-semibold text-primary">{t('errorBoundary.title')}</h1>
        <p className="max-w-sm text-sm text-secondary">{t('errorBoundary.description')}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          {t('errorBoundary.reload')}
        </Button>
      </div>
    )
  }
}
