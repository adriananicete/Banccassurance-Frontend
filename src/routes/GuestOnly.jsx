import { Navigate, Outlet } from 'react-router'

import { useAuth } from '@/features/auth/AuthContext'

import { paths } from './paths'

/**
 * Login and registration, for someone who already has a session.
 *
 * Without this, signing in and then pressing Back lands on a login form that
 * would start a second OTP for an account already signed in.
 */
export function GuestOnly() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return null
  if (isAuthenticated) return <Navigate to={paths.home} replace />

  return <Outlet />
}
