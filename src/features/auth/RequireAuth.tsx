import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

/**
 * Redirects unauthenticated visitors to /login, preserving the intended
 * destination so LoginPage can send them back after signing in. Nothing
 * renders while the session is still being restored, to avoid a flash of
 * the login redirect on a hard refresh of a protected URL.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}
