import {
  LuBell,
  LuFileText,
  LuLayoutDashboard,
  LuList,
  LuMessageSquare,
  LuPlus,
  LuShield,
  LuUser,
  LuUserCheck,
  LuUsers,
} from 'react-icons/lu'

import {
  APPROVER_ROLES,
  ASSIGN_BRANCHES_ROLES,
  ASSIGN_GROUPS_ROLES,
  ASSIGN_REGION_ROLES,
  AUDIT_ROLES,
  MESSAGING_DENIED_ROLES,
  REFERRAL_CREATOR_ROLES,
  ROLES,
} from '@/constants/roles'
import { paths } from '@/routes/paths'

/** Everyone who may reach any of the three assign screens. */
const ASSIGNER_ROLES = [
  ...new Set([...ASSIGN_BRANCHES_ROLES, ...ASSIGN_GROUPS_ROLES, ...ASSIGN_REGION_ROLES]),
]

/**
 * The navigation, and which roles see each entry.
 *
 * `allowed` is a whitelist; `denied` is a blacklist; an entry with neither is
 * shown to every signed-in role. Use the named lists from constants/roles.js
 * rather than spelling roles out here, so a rule lives in one place.
 *
 * THIS DECIDES WHAT IS SHOWN, NOT WHAT IS PERMITTED. Every route is enforced
 * again by RequireRole, and every endpoint again by the API. Hiding an entry
 * is a courtesy -- a nav item that always answers 403 is worse than no item.
 */
export const NAV_ITEMS = [
  {
    to: paths.dashboard,
    label: 'Dashboard',
    Icon: LuLayoutDashboard,
    // A superadmin never creates or reads a referral, so every referral-shaped
    // screen is empty by definition for them.
    denied: [ROLES.SUPERADMIN],
  },
  {
    to: paths.referrals,
    label: 'Referrals',
    Icon: LuList,
    denied: [ROLES.SUPERADMIN],
  },
  {
    to: paths.referralNew,
    label: 'New referral',
    Icon: LuPlus,
    // Three of the nine. The API refuses the other six either way; this is so
    // they never see a button that can only fail.
    allowed: REFERRAL_CREATOR_ROLES,
  },
  {
    to: paths.reports,
    label: 'Reports',
    Icon: LuFileText,
    denied: [ROLES.SUPERADMIN],
  },
  {
    to: paths.approvals,
    label: 'Approvals',
    Icon: LuUserCheck,
    allowed: APPROVER_ROLES,
  },
  {
    to: paths.people,
    label: 'Assignments',
    Icon: LuUsers,
    allowed: ASSIGNER_ROLES,
  },
  {
    to: paths.messages,
    label: 'Messages',
    Icon: LuMessageSquare,
    // Three roles get a 403 on all seven /messages endpoints and their socket
    // handshake is refused, so the icon is hidden rather than left to fail.
    denied: MESSAGING_DENIED_ROLES,
  },
  {
    to: paths.notifications,
    label: 'Notifications',
    Icon: LuBell,
  },
  {
    to: paths.audit,
    label: 'Audit log',
    Icon: LuShield,
    // Superadmin only -- including the roles that write rows to it.
    allowed: AUDIT_ROLES,
  },
  {
    to: paths.profile,
    label: 'Profile',
    Icon: LuUser,
  },
]

export function navItemsForRole(role) {
  if (!role) return []
  return NAV_ITEMS.filter((item) => {
    if (item.allowed && !item.allowed.includes(role)) return false
    if (item.denied && item.denied.includes(role)) return false
    return true
  })
}
