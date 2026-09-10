import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuth } from '@/features/auth/AuthContext'

import { paths } from './paths'

/**
 * The session gate.
 *
 * There is no token to inspect -- the cookie is httpOnly -- so "are we signed
 * in" is answered by whether GET /users/scope succeeded. Three states, and
 * the middle one is the reason this is not a boolean:
 *
 *   loading   we do not know yet. Show nothing rather than a login form the
 *             user is about to be redirected away from.
 *   no user   401, or logged out. Send to /login, remembering where they were.
 *   user      render the route.
 */
export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <SessionSplash />
  }

  if (!isAuthenticated) {
    // `from` lets the login flow put them back where they were heading, which
    // matters most for a link someone was sent after their session expired.
    return <Navigate to={paths.login} state={{ from: location }} replace />
  }

  return <Outlet />
}

/**
 * Deliberately plain. This is visible for one request at app start, and it is
 * scaffolding -- replace it with your own loading treatment.
 */
function SessionSplash() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  )
}
