import { Navigate, Outlet } from 'react-router'

import { useAuth } from '@/features/auth/AuthContext'
import { hasRole } from '@/constants/roles'

import { paths } from './paths'

/**
 * A role gate on a route.
 *
 * The API refuses the wrong role anyway -- this is so a user never reaches a
 * screen that can only fail. It is not a security boundary: the browser is not
 * where access is decided, and every one of these routes is enforced again
 * server-side on each request.
 *
 * Use the named lists in constants/roles.js rather than spelling out roles at
 * the call site, so a rule lives in one place.
 */
export function RequireRole({ allowed, redirectTo = paths.home }) {
  const { role, isLoading } = useAuth()

  // RequireAuth has already resolved the session above this, but a direct
  // mount would not have -- guard anyway rather than redirecting on a role
  // we simply have not read yet.
  if (isLoading) return null

  if (!hasRole(role, allowed)) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
