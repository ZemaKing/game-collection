import { Component, type ErrorInfo, type ReactNode } from 'react'
import { translate, type Locale } from '@/lib/i18n'

function getLocale(): Locale {
  const stored = window.localStorage.getItem('locale')
  return stored === 'sr' || stored === 'en' ? stored : 'sr'
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
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          {t('errorBoundary.reload')}
        </button>
      </div>
    )
  }
}
