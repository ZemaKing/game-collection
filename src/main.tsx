import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from '@/App.tsx'
import { AuthProvider } from '@/components/AuthProvider'
import { LocaleProvider } from '@/components/LocaleProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LocaleProvider>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  </StrictMode>,
)
