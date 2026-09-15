import { useState } from 'react'
import { Outlet, useLocation } from 'react-router'

import landbankLogo from '@/assets/landbank-logo-png_seeklogo-351859.png'
import philLifeLogo from '@/assets/PhilLife-Color-resize.png'
import { AppShell } from '@/components/layout/AppShell'
import {
  MESSAGING_DENIED_ROLES,
  REACH,
  ROLE_LABELS,
  TENANT_LABELS,
  TENANTS,
  hasRole,
  tenantOf,
} from '@/constants/roles'
import { useAuth } from '@/features/auth/AuthContext'
import { useLogout } from '@/features/auth/hooks'
import { useMessagesSocket, useUnreadMessages } from '@/features/messages/hooks'
import { useNotificationCounts } from '@/features/notifications/hooks'
import { avatarUrl } from '@/lib/apiClient'
import { THEMES, applyTheme, readTheme } from '@/lib/theme'

import { navItemsForRole } from './navigation'

/**
 * The header logo for each company. A superadmin belongs to neither, so gets
 * none rather than one company's brand.
 */
const TENANT_LOGOS = {
  [TENANTS.LANDBANK]: landbankLogo,
  [TENANTS.PHILLIFE]: philLifeLogo,
}

/**
 * The container behind AppShell. Everything that reads the session or talks to
 * the API happens here; the shell only renders what it is handed.
 */
export function AppLayout() {
  const { user, profile } = useAuth()
  const logoutMutation = useLogout()
  // The bell's badge: every unread the user has, refreshed every minute.
  const notificationCounts = useNotificationCounts()
  // Chat, for the six roles that have it: the icon's unread count, and the
  // socket that refreshes messages as they arrive.
  const canMessage = !hasRole(user?.role, MESSAGING_DENIED_ROLES)
  const unreadMessages = useUnreadMessages({ enabled: Boolean(user) && canMessage })
  useMessagesSocket(Boolean(user) && canMessage)
  const location = useLocation()

  // The session's tenant, or the user code's prefix if it has not arrived.
  const tenant = user?.tenant ?? tenantOf(user?.userCode)

  const [isSidebarOpen, setSidebarOpen] = useState(false)

  // Light or dark, from the sidebar footer. main.jsx applied the saved one
  // before the first render; this keeps the switch in step and saves changes.
  const [theme, setTheme] = useState(readTheme)
  const changeTheme = (isDark) => {
    const next = isDark ? THEMES.DARK : THEMES.LIGHT
    applyTheme(next)
    setTheme(next)
  }

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
      logoSrc={TENANT_LOGOS[tenant] ?? null}
      logoAlt={TENANT_LABELS[tenant] ?? ''}
      scopeWarning={scopeWarningFor(user)}
      isSidebarOpen={isSidebarOpen}
      onToggleSidebar={() => setSidebarOpen((open) => !open)}
      onCloseSidebar={() => setSidebarOpen(false)}
      onLogout={() => logoutMutation.mutate()}
      isLoggingOut={logoutMutation.isPending}
      unreadNotifications={notificationCounts.unread ?? 0}
      // Sector Head, Department Head and Superadmin have no chat: every
      // /messages endpoint answers 403 and the socket is refused (BACKEND.md §11).
      canMessage={canMessage}
      unreadMessages={unreadMessages.data ?? 0}
      isDarkTheme={theme === THEMES.DARK}
      onThemeChange={changeTheme}
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
