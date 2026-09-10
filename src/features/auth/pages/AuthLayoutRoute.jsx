import { Outlet } from 'react-router'

import { AuthLayout } from '../components/AuthLayout'

/**
 * The layout route for both login steps.
 *
 * Because this sits above /login and /login/verify rather than inside them,
 * react-router keeps AuthLayout mounted across the navigation and swaps only
 * the child. The logo, the title and the card never unmount -- no flicker, and
 * the logo is not re-decoded on the way to the OTP screen.
 */
export function AuthLayoutRoute() {
  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  )
}
