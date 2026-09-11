import { useState } from "react";
import { LuLogOut, LuMenu, LuUser, LuX } from "react-icons/lu";
import { NavLink } from "react-router";

import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import logo from "../../assets/PhilLife-Color-resize.png";
import { IoNotificationsOutline } from "react-icons/io5";
import { LuMoon } from "react-icons/lu";
import { LuMessageSquareMore } from "react-icons/lu";
import { IoSettingsOutline } from "react-icons/io5";
import { IoIosArrowForward } from "react-icons/io";

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
  // Purely visual: whether the Settings group at the foot of the sidebar is
  // showing its two items. Nothing outside this file cares, so it stays here
  // rather than being lifted into AppLayout.
  const [isSettingsOpen, setSettingsOpen] = useState(false);

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
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200",
          "lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-start gap-3 border-b border-sidebar-border px-4">
          <div className="bg-neutral-100 border w-[38px] h-[38px] rounded-full flex justify-start items-center">
            <img src="" width={68} alt="" />
          </div>

          <div className="h-full flex flex-col justify-center items-start">
            <span className="text-xs font-semibold">Jimmy Santos</span>
            <span className="text-[11px] text-neutral-500 leading-4">
              Department Head
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

        {/* The two things that are not places in the app -- the account, and
            the way out of it. They open upward so the trigger stays put. */}
        <div className="w-full min-h-25 px-8 pb-4 flex flex-col justify-end items-stretch">
          {isSettingsOpen ? (
            <div className="flex flex-col gap-1 pb-2">
              <NavLink
                to={paths.profile}
                onClick={onCloseSidebar}
                className={({ isActive }) =>
                  cn(
                    // The negative margin cancels the padding, so the hover
                    // block is wider than the text without shifting the label
                    // out of line with Settings below it.
                    "w-full flex items-center gap-2 -mx-2.5 px-2.5 rounded-md py-1.5 text-xs text-sidebar-foreground transition-colors",
                    isActive
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      : "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )
                }
              >
                <LuUser aria-hidden className="size-3.5 shrink-0" />
                <span className="truncate">Profile</span>
              </NavLink>

              <button
                type="button"
                onClick={onLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-2 -mx-2.5 px-2.5 rounded-md py-1.5 text-xs text-destructive/90 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <LuLogOut aria-hidden className="size-3.5 shrink-0" />
                <span className="truncate">
                  {isLoggingOut ? "Signing out…" : "Sign out"}
                </span>
              </button>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setSettingsOpen((open) => !open)}
            aria-expanded={isSettingsOpen}
            className="w-full flex justify-between items-center -mx-2.5 px-2.5 rounded-md py-1.5 cursor-pointer text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          >
            <div className="flex justify-start items-center gap-2">
              <IoSettingsOutline size={14} />

              <span className="text-xs">Settings</span>
            </div>
            <IoIosArrowForward
              size={14}
              aria-hidden
              className={cn(
                "transition-transform duration-200",
                isSettingsOpen ? "-rotate-90" : "rotate-90",
              )}
            />
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 justify-between items-center gap-3 border-b border-border px-4">
          <div className="h-full flex justify-start items-center gap-2">
            <div className="bg-neutral-100 border py-1 rounded-sm flex justify-start items-center">
              <img src={logo} width={68} alt="" />
            </div>
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
            {/* Messages deliberately has no `to` yet -- see the note on
                HeaderIconButton. Three roles get a 403 on every /messages
                endpoint, and this header is not filtered by role the way the
                sidebar is. */}
            <HeaderIconButton Icon={LuMessageSquareMore} label="Messages" />

            <HeaderIconButton
              Icon={IoNotificationsOutline}
              label="Notifications"
              to={paths.notifications}
            />

            <HeaderIconButton Icon={LuMoon} label="Switch to dark theme" />
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
 *
 * Pass one of `to` or `onClick`. With neither it renders as a disabled button
 * rather than something that looks live and swallows the click.
 *
 * ⚠️ THIS ROW IS NOT FILTERED BY ROLE, unlike the sidebar. If an entry only
 * works for some roles, the caller has to decide -- this component cannot.
 */
function HeaderIconButton({ Icon, label, to, onClick }) {
  const className =
    "border bg-neutral-100 flex justify-center items-center p-2 rounded-sm transition-colors hover:bg-neutral-200";

  if (to) {
    return (
      <NavLink to={to} aria-label={label} title={label} className={className}>
        <Icon aria-hidden />
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
          event.currentTarget.style.display = "none";
        }}
      />
    );
  }

  const initials = String(name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span
      aria-hidden
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
    >
      {initials || "—"}
    </span>
  );
}
