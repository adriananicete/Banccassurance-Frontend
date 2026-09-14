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
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { VerifyOtpPage } from '@/features/auth/pages/VerifyOtpPage'
import { DashboardPage } from '@/features/reports/pages/DashboardPage'
import { ChooseTenantPage } from '@/features/users/pages/ChooseTenantPage'
import { RegisterPage } from '@/features/users/pages/RegisterPage'
import { GuestOnly } from '@/routes/GuestOnly'
import { RequireAuth } from '@/routes/RequireAuth'
import { RequireRole } from '@/routes/RequireRole'
import { paths } from '@/routes/paths'

import { AppLayout } from './AppLayout'
import { NotBuiltYet } from './NotBuiltYet'
import { ScaffoldHome } from './ScaffoldHome'

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
          { path: paths.home, element: <ScaffoldHome /> },

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
                element: (
                  <NotBuiltYet
                    title="Reports"
                    note="One call per drill-down expansion. Landbank walks AREA → BRANCH; PhilLife walks REGION → AREA → AO."
                    endpoints={['GET /reports/summary', 'GET /reports/export']}
                  />
                ),
              },
            ],
          },

          {
            element: <RequireRole allowed={REFERRAL_LIST_ROLES} />,
            children: [
              {
                path: paths.referrals,
                element: (
                  <NotBuiltYet
                    title="Referrals"
                    note="Paged, searchable, sortable and filterable — all server-side."
                    endpoints={['GET /referrals', 'GET /referrals/counts']}
                  />
                ),
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
                element: (
                  <NotBuiltYet
                    title="Approvals"
                    note="Each role approves exactly the one below it, and no further."
                    endpoints={['GET /users/approvals', 'POST /users/approvals/action']}
                  />
                ),
              },
            ],
          },

          {
            element: <RequireRole allowed={ASSIGNER_ROLES} />,
            children: [
              {
                path: paths.people,
                element: (
                  <NotBuiltYet
                    title="Assignments"
                    note="These three replace the whole set rather than adding to it — read with the GET before writing, or saving drops whatever the screen did not know about."
                    endpoints={[
                      'GET · PUT /users/:userId/branches',
                      'GET · PUT /users/:userId/groups',
                      'GET · PUT /users/:userId/region',
                      'GET /users/assignable-branches',
                    ]}
                  />
                ),
              },
            ],
          },

          {
            element: <RequireRole allowed={MESSAGING_ROLES} />,
            children: [
              {
                path: paths.messages,
                element: (
                  <NotBuiltYet
                    title="Messages"
                    note="Sends are HTTP; the socket is delivery only. Needs socket.io-client@^4 — the major must match the server."
                    endpoints={['GET /messages/conversations', 'POST /messages/conversations/:id']}
                  />
                ),
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
            element: (
              <NotBuiltYet
                title="Notifications"
                note="The list key is `notifications`, not `data`, and the badge comes from `unreadCount` rather than the returned array."
                endpoints={[
                  'GET /notifications',
                  'PUT /notifications/:id/read',
                  'PUT /notifications/mark-all-read',
                ]}
              />
            ),
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
