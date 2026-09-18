import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/hooks/useAuth'

/**
 * Redirects unauthenticated visitors to /login, preserving the intended
 * destination so LoginPage can send them back after signing in. A spinner
 * renders while the session is still being restored, to avoid a blank
 * screen on a hard refresh of a protected URL.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={24} className="text-muted" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}
