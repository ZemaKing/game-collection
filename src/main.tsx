import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from '@/App.tsx'
import { AuthProvider } from '@/components/AuthProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LocaleProvider } from '@/components/LocaleProvider'
import { SettingsProvider } from '@/components/SettingsProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import './index.css'

window.addEventListener('error', (event) => {
  console.error('[GlobalError] Uncaught error', event.error ?? event.message)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('[GlobalError] Unhandled promise rejection', event.reason)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <SettingsProvider>
        <ThemeProvider>
          <LocaleProvider>
            <AuthProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </SettingsProvider>
    </ErrorBoundary>
  </StrictMode>,
)
