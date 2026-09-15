import { Navigate } from 'react-router'

import { useAuth } from '@/features/auth/AuthContext'

import { homeFor } from './navigation'

/**
 * `/` -- sends a signed-in user to their role's first screen (the Dashboard).
 * Every "go home" in the app, including the end of sign-in, points at `/` and
 * lands here, so the choice lives in one place: `homeFor` in navigation.js.
 */
export function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={homeFor(user?.role)} replace />
}
