import { createBrowserRouter } from 'react-router'

import { LoginPage } from '@/features/auth/pages/LoginPage'
import { VerifyOtpPage } from '@/features/auth/pages/VerifyOtpPage'
import { GuestOnly } from '@/routes/GuestOnly'
import { RequireAuth } from '@/routes/RequireAuth'
import { paths } from '@/routes/paths'

import { ScaffoldHome } from './ScaffoldHome'

/**
 * The route table.
 *
 * Only the routes that exist today are here. The rest are added as their
 * screens are built -- an entry pointing at a page that does not exist is a
 * build error, and a placeholder route that renders nothing is worse than a
 * 404 because it looks like a bug in the page rather than a missing feature.
 *
 * The shape to grow into, from context/PROJECT.md section 5:
 *
 *   GuestOnly     /login  /login/verify  /register
 *   RequireAuth   /  /referrals  /referrals/:id  /referrals/new
 *                 /approvals  /people  /profile
 *                 /dashboard  /reports  /notifications  /messages
 *   RequireRole   /referrals/new -> REFERRAL_CREATOR_ROLES
 *                 /audit         -> AUDIT_ROLES
 *                 /messages      -> everyone except MESSAGING_DENIED_ROLES
 */
export const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [
      { path: paths.login, element: <LoginPage /> },
      { path: paths.loginVerify, element: <VerifyOtpPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [{ path: paths.home, element: <ScaffoldHome /> }],
  },
])
