import { Navigate, Outlet } from 'react-router'

import { useAuth } from '@/features/auth/AuthContext'

import { paths } from './paths'

/**
 * Login and registration, for someone who already has a session.
 *
 * Without this, signing in and then pressing Back lands on a login form that
 * would start a second OTP for an account already signed in.
 *
 * It also fires at the end of a successful sign-in, the moment the session
 * lands and before VerifyOtpPage's own navigate runs. Both go to `/`, which
 * redirects to the role's Dashboard, so whichever wins the race the user lands
 * in the same place.
 */
export function GuestOnly() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return null

  // Home, not `from`: the end of sign-in always lands on the Dashboard
  // (Adrian, 2026-09-15) -- see VerifyOtpPage.
  if (isAuthenticated) {
    return <Navigate to={paths.home} replace />
  }

  return <Outlet />
}
