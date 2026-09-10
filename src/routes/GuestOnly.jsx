import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuth } from '@/features/auth/AuthContext'

import { paths } from './paths'

/**
 * Login and registration, for someone who already has a session.
 *
 * Without this, signing in and then pressing Back lands on a login form that
 * would start a second OTP for an account already signed in.
 *
 * It also fires at the end of a successful sign-in, the moment the session
 * lands and before VerifyOtpPage's own navigate runs -- so it honours the
 * same `from` that RequireAuth stashed on the way in. Whichever of the two
 * wins the race, the user arrives at the page they were originally heading
 * for rather than the dashboard.
 */
export function GuestOnly() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return null

  if (isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname ?? paths.home} replace />
  }

  return <Outlet />
}
