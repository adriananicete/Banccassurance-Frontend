import { LuLogOut, LuMenu, LuMoon, LuSun, LuX } from "react-icons/lu";
import { NavLink } from "react-router";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { UserAvatar } from "@/components/UserAvatar";
import { formatWeekdayDate } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import { IoNotificationsOutline } from "react-icons/io5";
import { LuMessageSquareMore } from "react-icons/lu";
import { IoSettingsOutline } from "react-icons/io5";

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
 *   logoSrc / logoAlt  The company logo for the header -- Landbank or PhilLife,
 *                  chosen by AppLayout from the session's tenant. Null shows none.
 *   scopeWarning   A string, or null. Shown as a banner across every screen --
 *                  see the note in AppLayout for why it lives at this level.
 *   isSidebarOpen  Mobile only. The sidebar is always visible from lg up.
 *   onToggleSidebar / onCloseSidebar
 *   onLogout / isLoggingOut
 *   unreadNotifications  A number. Shown on the bell when above zero.
 *   canMessage     False hides the messages icon -- for the roles with no chat.
 *   unreadMessages A number. Shown on the message icon when above zero.
 *   isDarkTheme / onThemeChange(checked)   The footer's light / dark switch.
 *   children       The routed page.
 */
export function AppShell({
  navItems,
  displayName,
  roleLabel,
  userCode,
  avatarSrc,
  logoSrc,
  logoAlt,
  scopeWarning,
  isSidebarOpen,
  onToggleSidebar,
  onCloseSidebar,
  onLogout,
  isLoggingOut,
  unreadNotifications = 0,
  canMessage = false,
  unreadMessages = 0,
  isDarkTheme = false,
  onThemeChange,
  children,
}) {

  return (
    // Full screen up to 1800px wide -- 14" to 16" laptops. From 1800px (17"
    // and larger screens, usually 1920px) the app becomes an inset card on a
    // #e5e7eb ground with a shadow, on Adrian's screenshots/backgroundStyle.png
    // (2026-09-15). A browser knows pixels, not inches, so 1800px is the line.
    // Inset, the card is the scroll container: the sidebar is absolute to it
    // rather than fixed to the window, and the content column scrolls inside.
    <div className="min-h-screen bg-background min-[1800px]:h-dvh min-[1800px]:bg-[#e5e7eb] min-[1800px]:px-10 min-[1800px]:py-6 min-[1800px]:dark:bg-black">
      <div className="relative min-[1800px]:h-full min-[1800px]:overflow-hidden min-[1800px]:rounded-md min-[1800px]:bg-background min-[1800px]:shadow-xl">
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
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 min-[1800px]:absolute",
          "lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* The signed-in account: its photo, name and role. The name is cached
            from login and a fresh browser may not have it yet while the session
            is valid, so it falls back to the user code; the photo falls back to
            initials. */}
        <div className="flex h-18 shrink-0 items-center justify-start gap-3 border-b border-sidebar-border px-4">
          <UserAvatar src={avatarSrc} name={displayName ?? userCode} size="lg" />

          <div className="min-w-0 flex-1 h-full flex flex-col justify-center items-start">
            <span className="w-full truncate text-xs font-semibold" title={displayName ?? userCode}>
              {displayName ?? userCode}
            </span>
            <span className="w-full truncate text-[11px] text-neutral-500 leading-4">
              {roleLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={onCloseSidebar}
            aria-label="Close menu"
            className="rounded-md p-1 text-sidebar-foreground lg:hidden"
          >
            <LuX aria-hidden className="size-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-2 overflow-y-auto justify-start items-start p-5">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onCloseSidebar}
              // `end` on the home path only, so "/" does not stay active on
              // every child route.
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "w-full flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs text-sidebar-foreground",
                  isActive
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent/60",
                )
              }
            >
              <Icon aria-hidden className="size-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* The sidebar footer, on Adrian's screenshots/footer.png (2026-09-15),
            without the photo -- the account is already at the top. Settings
            (to Profile) with sign out as a red icon on the right; a separator;
            the light / dark switch, which moved here from the header; and the
            credit line. */}
        <div className="flex w-full flex-col gap-3 px-5 pb-4">
          <div className="flex items-center justify-between gap-2">
            <NavLink
              to={paths.profile}
              onClick={onCloseSidebar}
              className={({ isActive }) =>
                cn(
                  "-mx-2.5 flex flex-1 items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] text-sidebar-foreground transition-colors",
                  isActive
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent/60",
                )
              }
            >
              <IoSettingsOutline size={13} aria-hidden />
              Settings
            </NavLink>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onLogout}
              disabled={isLoggingOut}
              aria-label={isLoggingOut ? "Signing out" : "Sign out"}
              title="Sign out"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LuLogOut aria-hidden />
            </Button>
          </div>

          {/* Pulled up to sit closer to the Settings row (Adrian). */}
          <Separator className="-mt-1.5" />

          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-sidebar-foreground">
              {isDarkTheme ? "You're in dark mode" : "You're in light mode"}
            </span>
            {/* shadcn Switch, sized up to the screenshot, the sun or moon in
                its thumb. */}
            <Switch
              checked={isDarkTheme}
              onCheckedChange={onThemeChange}
              aria-label="Dark mode"
              className="cursor-pointer data-[size=default]:h-5 data-[size=default]:w-9"
              thumbClassName="flex items-center justify-center text-muted-foreground shadow-sm group-data-[size=default]/switch:size-4 group-data-[size=default]/switch:data-checked:translate-x-4"
            >
              {isDarkTheme ? <LuMoon className="size-2.5" /> : <LuSun className="size-2.5" />}
            </Switch>
          </div>

          <p className="text-[9px] text-muted-foreground">
            Design &amp; Built by Phillife-IT
          </p>
        </div>      </aside>

      <div className="lg:pl-60 min-[1800px]:h-full min-[1800px]:overflow-y-auto">
        {/* Opaque, so content scrolling under the sticky header is covered
            rather than showing through it. */}
        {/* px-6, up from px-4, and h-18, up from h-16 (Adrian). The sidebar's
            account block is h-18 too, so the two bottom borders stay level. */}
        <header className="sticky top-0 z-20 flex h-18 justify-between items-center gap-3 border-b border-border bg-background px-6">
          <div className="h-full flex justify-start items-center gap-2">
            {/* The signed-in user's company: Landbank or PhilLife. Height-bound,
                because one logo is wide and the other square. */}
            {logoSrc ? (
              <div className="bg-neutral-100 border py-1 px-1 rounded-sm flex justify-start items-center">
                <img src={logoSrc} alt={logoAlt ?? ""} className="h-6 w-auto" />
              </div>
            ) : null}
            <h1 className="font-bold">Banccassurance Referral System</h1>
          </div>

          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Open menu"
            aria-expanded={isSidebarOpen}
            className="rounded-md p-2 lg:hidden"
          >
            <LuMenu aria-hidden className="size-5" />
          </button>

          <div className="ml-auto flex items-center gap-2 pr-3">
            {/* Today, in Manila like every other date on screen. Hidden on
                phones, where the header has no room beside the logo. */}
            <span className="mr-2 hidden text-xs text-muted-foreground md:inline">
              {formatWeekdayDate()}
            </span>

            {/* The only way to Messages -- not in the sidebar (Adrian,
                2026-09-15). Hidden for the Sector Head, Department Head and
                Superadmin, who have no chat: every /messages endpoint answers
                403 for them. The count is every unread message. */}
            {canMessage ? (
              <HeaderIconButton
                Icon={LuMessageSquareMore}
                label={unreadMessages > 0 ? `Messages, ${unreadMessages} unread` : "Messages"}
                to={paths.messages}
                badge={unreadMessages}
              />
            ) : null}

            {/* The only way to Notifications -- it left the sidebar (Adrian).
                The count is every unread the user has. */}
            <HeaderIconButton
              Icon={IoNotificationsOutline}
              label={
                unreadNotifications > 0
                  ? `Notifications, ${unreadNotifications} unread`
                  : "Notifications"
              }
              to={paths.notifications}
              badge={unreadNotifications}
            />

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

        <main className="p-4">{children}</main>
      </div>
      </div>
    </div>
  );
}

/**
 * The square icon buttons in the header. Identical but for the icon, so the
 * styling lives here once.
 *
 *   Icon     A react-icons component.
 *   label    REQUIRED. An icon on its own has no accessible name, and the
 *            tooltip is the only thing that says what it does on a mouse.
 *   to       A route, for the ones that go somewhere.
 *   onClick  An action, for the ones that do something here.
 *   badge    Optional number. Above zero, a small blue count on the corner,
 *            capped at 99+.
 *
 * Pass one of `to` or `onClick`. With neither it renders as a disabled button
 * rather than something that looks live and swallows the click.
 *
 * ⚠️ THIS ROW IS NOT FILTERED BY ROLE, unlike the sidebar. If an entry only
 * works for some roles, the caller has to decide -- this component cannot.
 */
function HeaderIconButton({ Icon, label, to, onClick, badge = 0 }) {
  const className =
    "relative border bg-neutral-100 flex justify-center items-center p-2 rounded-sm transition-colors hover:bg-neutral-200";

  const count =
    badge > 0 ? (
      <span
        aria-hidden
        className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#155dfc] px-1 text-[10px] leading-none font-semibold text-white tabular-nums"
      >
        {badge > 99 ? "99+" : badge}
      </span>
    ) : null;

  if (to) {
    return (
      <NavLink to={to} aria-label={label} title={label} className={className}>
        <Icon aria-hidden />
        {count}
      </NavLink>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={label}
      title={label}
      className={cn(className, "disabled:opacity-50")}
    >
      <Icon aria-hidden />
    </button>
  );
}
