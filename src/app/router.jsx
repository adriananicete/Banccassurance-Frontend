import { createBrowserRouter } from 'react-router'

import {
  APPROVER_ROLES,
  ASSIGN_BRANCHES_ROLES,
  ASSIGN_GROUPS_ROLES,
  ASSIGN_REGION_ROLES,
  AUDIT_ROLES,
  MESSAGING_DENIED_ROLES,
  REFERRAL_CREATOR_ROLES,
  REFERRAL_LIST_DENIED_ROLES,
  ROLES,
} from '@/constants/roles'
import { AuthLayoutRoute } from '@/features/auth/pages/AuthLayoutRoute'
import { AssignmentsPage } from '@/features/assignments/pages/AssignmentsPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { MessagesPage } from '@/features/messages/pages/MessagesPage'
import { NotificationsPage } from '@/features/notifications/pages/NotificationsPage'
import { VerifyOtpPage } from '@/features/auth/pages/VerifyOtpPage'
import { DashboardPage } from '@/features/reports/pages/DashboardPage'
import { ReferralsPage } from '@/features/referrals/pages/ReferralsPage'
import { ReportsPage } from '@/features/reports/pages/ReportsPage'
import { ApprovalsPage } from '@/features/users/pages/ApprovalsPage'
import { ChooseTenantPage } from '@/features/users/pages/ChooseTenantPage'
import { RegisterPage } from '@/features/users/pages/RegisterPage'
import { GuestOnly } from '@/routes/GuestOnly'
import { RequireAuth } from '@/routes/RequireAuth'
import { RequireRole } from '@/routes/RequireRole'
import { paths } from '@/routes/paths'

import { AppLayout } from './AppLayout'
import { NotBuiltYet } from './NotBuiltYet'
import { HomeRedirect } from './HomeRedirect'

const EVERY_ROLE_EXCEPT_SUPERADMIN = Object.values(ROLES).filter(
  (role) => role !== ROLES.SUPERADMIN,
)

const REFERRAL_LIST_ROLES = Object.values(ROLES).filter(
  (role) => !REFERRAL_LIST_DENIED_ROLES.includes(role),
)

const MESSAGING_ROLES = Object.values(ROLES).filter(
  (role) => !MESSAGING_DENIED_ROLES.includes(role),
)

const ASSIGNER_ROLES = [
  ...new Set([...ASSIGN_BRANCHES_ROLES, ...ASSIGN_GROUPS_ROLES, ...ASSIGN_REGION_ROLES]),
]

/**
 * The route table.
 *
 * Every path a nav item points at exists here, so a visible link can never
 * answer 404. The ones whose screens are not written yet render NotBuiltYet,
 * which names the endpoints behind them.
 *
 * The role gates repeat what app/navigation.js already filtered, on purpose:
 * the nav hides an entry, and this refuses the URL. A user who types a path or
 * follows an old link should not land on a screen that can only fail. Neither
 * is a security boundary -- the API enforces all of it again on every request.
 */
export const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [
      {
        // A LAYOUT ROUTE, not a wrapper component. Keeping AuthLayout here --
        // above both steps rather than inside each -- is what lets the logo,
        // the title and the card stay mounted while /login swaps to
        // /login/verify. Only the form is replaced.
        element: <AuthLayoutRoute />,
        children: [
          { path: paths.login, element: <LoginPage /> },
          { path: paths.loginVerify, element: <VerifyOtpPage /> },
          // Registration is two steps, and the company sits in the URL rather
          // than in state: the back button returns to the chooser, and a
          // reload of a half-filled form does not lose which company it is.
          { path: paths.register, element: <ChooseTenantPage /> },
          { path: paths.registerFor(':tenant'), element: <RegisterPage /> },
        ],
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // The Dashboard, or Approvals for a superadmin -- see homeFor.
          { path: paths.home, element: <HomeRedirect /> },

          {
            element: <RequireRole allowed={EVERY_ROLE_EXCEPT_SUPERADMIN} />,
            children: [
              {
                path: paths.dashboard,
                // The only screen that differs per role rather than only being
                // scoped per role, so the page picks the component. The roles
                // whose view is not designed yet still get NotBuiltYet, from
                // inside the page.
                element: <DashboardPage />,
              },
              {
                path: paths.reports,
                // The export page for the tenant heads; other roles get the scaffold.
                element: <ReportsPage />,
              },
            ],
          },

          {
            element: <RequireRole allowed={REFERRAL_LIST_ROLES} />,
            children: [
              {
                path: paths.referrals,
                // The status drill-down for the tenant heads; the scaffold for everyone else.
                element: <ReferralsPage />,

              },
            ],
          },

          {
            element: <RequireRole allowed={REFERRAL_CREATOR_ROLES} />,
            children: [
              {
                path: paths.referralNew,
                element: (
                  <NotBuiltYet
                    title="New referral"
                    note="Consent is the gate: nothing can be created until that email holds a CONFIRMED or UPLOADED consent, and the address must be carried through rather than retyped."
                    endpoints={[
                      'GET /consent/check',
                      'POST /consent/send',
                      'POST /consent/upload',
                      'GET /referrals/referrer',
                      'GET /lookups/plans',
                      'POST /referrals',
                    ]}
                  />
                ),
              },
            ],
          },

          {
            element: <RequireRole allowed={APPROVER_ROLES} />,
            children: [
              {
                path: paths.approvals,
                // Each role approves exactly the one below it; the API scopes the list.
                element: <ApprovalsPage />,
              },
            ],
          },

          {
            element: <RequireRole allowed={ASSIGNER_ROLES} />,
            children: [
              {
                path: paths.people,
                // PhilLife heads assign the tier below; the superadmin keeps the scaffold inside.
                element: <AssignmentsPage />,
              },
            ],
          },

          {
            element: <RequireRole allowed={MESSAGING_ROLES} />,
            children: [
              {
                path: paths.messages,
                // Reached from the header's message icon, not the sidebar (Adrian).
                element: <MessagesPage />,
              },
            ],
          },

          {
            element: <RequireRole allowed={AUDIT_ROLES} />,
            children: [
              {
                path: paths.audit,
                element: (
                  <NotBuiltYet
                    title="Audit log"
                    note="Superadmin only — including the roles that write rows to it. Note that Id is a string, not a number."
                    endpoints={['GET /audit']}
                  />
                ),
              },
            ],
          },

          {
            path: paths.notifications,
            // Reached from the bell in the header, not the sidebar (Adrian).
            element: <NotificationsPage />,
          },
          {
            path: paths.profile,
            element: (
              <NotBuiltYet
                title="Profile"
                endpoints={['POST /users/change-password', 'POST /users/upload-photo']}
              />
            ),
          },
        ],
      },
    ],
  },
])
