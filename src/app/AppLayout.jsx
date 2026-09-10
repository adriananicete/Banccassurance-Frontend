import { useState } from 'react'
import { Outlet, useLocation } from 'react-router'

import { AppShell } from '@/components/layout/AppShell'
import { REACH, ROLE_LABELS } from '@/constants/roles'
import { useAuth } from '@/features/auth/AuthContext'
import { useLogout } from '@/features/auth/hooks'
import { avatarUrl } from '@/lib/apiClient'

import { navItemsForRole } from './navigation'

/**
 * The container behind AppShell. Everything that reads the session or talks to
 * the API happens here; the shell only renders what it is handed.
 */
export function AppLayout() {
  const { user, profile } = useAuth()
  const logoutMutation = useLogout()
  const location = useLocation()

  const [isSidebarOpen, setSidebarOpen] = useState(false)

  // Closing on navigation is handled by the shell's NavLink onClick, but a
  // route change from anywhere else (a redirect, a link inside a page) should
  // close it too.
  const [lastPath, setLastPath] = useState(location.pathname)
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    if (isSidebarOpen) setSidebarOpen(false)
  }

  return (
    <AppShell
      navItems={navItemsForRole(user?.role)}
      displayName={profile?.fullName ?? null}
      roleLabel={ROLE_LABELS[user?.role] ?? user?.role}
      userCode={user?.userCode}
      avatarSrc={avatarUrl(profile?.photo)}
      scopeWarning={scopeWarningFor(user)}
      isSidebarOpen={isSidebarOpen}
      onToggleSidebar={() => setSidebarOpen((open) => !open)}
      onCloseSidebar={() => setSidebarOpen(false)}
      onLogout={() => logoutMutation.mutate()}
      isLoggingOut={logoutMutation.isPending}
    >
      <Outlet />
    </AppShell>
  )
}

/**
 * An approved account that holds no scope cannot work, and the failure it
 * produces is confusing on its own: an empty referral list, and a 400 on the
 * create form saying the account has no assigned branches. Neither says why.
 *
 * READ `reach` BEFORE THE ARRAYS. An empty `scopes` under `TENANT` is correct
 * -- a Sector Head holds the whole tenant and has no rows to list. Under
 * `ASSIGNED` the same empty array means the opposite: holds nothing.
 *
 * It sits in the shell rather than on one screen because it blocks every
 * screen, and because approval and scope are separate decisions -- the gap
 * between them is a real state a real user sits in, not an error.
 */
function scopeWarningFor(user) {
  if (!user || user.reach !== REACH.ASSIGNED) return null
  if ((user.scopes?.length ?? 0) > 0) return null

  return (
    'This account has been approved but has not been assigned anything to cover yet, ' +
    'so most screens will be empty and referrals cannot be created. ' +
    'Whoever approved the account needs to assign its scope.'
  )
}
