import { LuLogOut, LuMenu, LuX } from 'react-icons/lu'
import { NavLink } from 'react-router'

import { cn } from '@/lib/utils'

/**
 * ============================================================================
 *  THIS FILE IS YOURS. Restyle it freely.
 * ============================================================================
 *
 * Presentational only. `app/AppLayout.jsx` decides which nav items this role
 * sees, resolves the avatar, and runs the logout -- none of that is here.
 *
 * The props contract:
 *
 *   navItems       [{ to, label, Icon }] -- already filtered for this role.
 *                  Render them; do not re-check permissions here.
 *   displayName    A string, or null. NULL IS ORDINARY: the name is cached
 *                  from login and a fresh browser has not got it yet, while
 *                  the session is perfectly valid. Fall back to userCode.
 *   roleLabel      "Branch Staff", "Account Officer", …
 *   userCode       "USR-STF-00001"
 *   avatarSrc      An absolute URL, or null. Fall back to initials.
 *   scopeWarning   A string, or null. Shown as a banner across every screen --
 *                  see the note in AppLayout for why it lives at this level.
 *   isSidebarOpen  Mobile only. The sidebar is always visible from lg up.
 *   onToggleSidebar / onCloseSidebar
 *   onLogout / isLoggingOut
 *   children       The routed page.
 */
export function AppShell({
  navItems,
  displayName,
  roleLabel,
  userCode,
  avatarSrc,
  scopeWarning,
  isSidebarOpen,
  onToggleSidebar,
  onCloseSidebar,
  onLogout,
  isLoggingOut,
  children,
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile backdrop. Hidden from assistive tech -- the close button in
          the sidebar header is the labelled way out. */}
      {isSidebarOpen ? (
        <div
          aria-hidden
          onClick={onCloseSidebar}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200',
          'lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border px-4">
          <span className="text-sm font-semibold text-sidebar-foreground">Bancassurance</span>
          <button
            type="button"
            onClick={onCloseSidebar}
            aria-label="Close menu"
            className="rounded-md p-1 text-sidebar-foreground lg:hidden"
          >
            <LuX aria-hidden className="size-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onCloseSidebar}
              // `end` on the home path only, so "/" does not stay active on
              // every child route.
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground',
                  isActive
                    ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                    : 'hover:bg-sidebar-accent/60',
                )
              }
            >
              <Icon aria-hidden className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background px-4">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Open menu"
            aria-expanded={isSidebarOpen}
            className="rounded-md p-2 lg:hidden"
          >
            <LuMenu aria-hidden className="size-5" />
          </button>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{displayName ?? userCode}</p>
              <p className="text-xs leading-tight text-muted-foreground">
                {roleLabel} · {userCode}
              </p>
            </div>

            <Avatar src={avatarSrc} name={displayName ?? userCode} />

            <button
              type="button"
              onClick={onLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm disabled:opacity-50"
            >
              <LuLogOut aria-hidden className="size-4" />
              <span className="hidden sm:inline">
                {isLoggingOut ? 'Signing out…' : 'Sign out'}
              </span>
            </button>
          </div>
        </header>

        {scopeWarning ? (
          <p
            role="status"
            className="border-b border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {scopeWarning}
          </p>
        ) : null}

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

function Avatar({ src, name }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="size-9 shrink-0 rounded-full object-cover"
        // The stored filename's extension is not a reliable content type, and
        // an avatar that 404s should not leave a broken-image icon in the
        // header. Drop to the initials instead.
        onError={(event) => {
          event.currentTarget.style.display = 'none'
        }}
      />
    )
  }

  const initials = String(name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <span
      aria-hidden
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
    >
      {initials || '—'}
    </span>
  )
}
