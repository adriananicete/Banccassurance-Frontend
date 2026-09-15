import { toast } from 'sonner'

import { ROLES } from '@/constants/roles'

/**
 * The Approvals screen's enums, labels and toasts -- one place, per
 * FRONTEND_DESIGN_PATTERN.md §12.
 *
 * Mirrors GET /users/approvals `status` and POST /users/approvals/action
 * `action` (context/BACKEND.md §6). Copy exact values; change both sides together.
 */

export const APPROVAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ALL: 'ALL',
}

export const APPROVAL_ACTION = {
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  DEACTIVATE: 'DEACTIVATE',
  REACTIVATE: 'REACTIVATE',
}

export const APPROVAL_STATUS_LABELS = {
  [APPROVAL_STATUS.PENDING]: 'Pending',
  [APPROVAL_STATUS.APPROVED]: 'Approved',
  [APPROVAL_STATUS.REJECTED]: 'Rejected',
  [APPROVAL_STATUS.ALL]: 'All',
}

/**
 * Who each approver role approves -- the tier directly below, and no further.
 * From userService.approveRejectUser. For the page's sentence only; the list
 * itself is already scoped by the API.
 */
export const APPROVES = {
  [ROLES.BRANCH_HEAD]: 'Branch Staff',
  [ROLES.GROUP_HEAD]: 'Branch Heads',
  [ROLES.SECTOR_HEAD]: 'Group Heads',
  [ROLES.DEPARTMENT_HEAD]: 'Regional Sales Heads',
  [ROLES.REGIONAL_SALES_HEAD]: 'Area Sales Heads',
  [ROLES.AREA_SALES_HEAD]: 'Account Officers',
  [ROLES.SUPERADMIN]: 'Sector Heads and Department Heads',
}

/**
 * The status badge. Amber waits, green is done (#00bb7c, the approved colour
 * used everywhere), red is stopped. `hover:` repeats the fill so a badge in a
 * hoverable row does not change colour.
 */
export const APPROVAL_STATUS_STYLES = {
  [APPROVAL_STATUS.PENDING]:
    'bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:bg-amber-500/15 dark:text-amber-400',
  [APPROVAL_STATUS.APPROVED]:
    'bg-[#00bb7c]/10 text-[#00996a] hover:bg-[#00bb7c]/10 dark:bg-[#00bb7c]/15 dark:text-[#00bb7c]',
  [APPROVAL_STATUS.REJECTED]:
    'bg-red-500/10 text-red-700 hover:bg-red-500/10 dark:bg-red-500/15 dark:text-red-400',
}

/**
 * The confirm dialog for each action. Every state change confirms first, and
 * names its consequence where it is not obvious (Design-Pattern.md §8):
 *
 *   REJECT     final. BACKEND.md §6: a rejected registration can never be
 *              reactivated, and the email address stays taken.
 *   DEACTIVATE superadmin only. The account and its history are kept; the
 *              person is refused at their next request. No email is sent.
 *
 * APPROVE and REJECT email the person (userService.runApprovalAction).
 */
export const APPROVAL_CONFIRM = {
  [APPROVAL_ACTION.APPROVE]: {
    title: (name) => `Approve ${name}?`,
    description: 'They can sign in once approved, and are told by email.',
    confirmLabel: 'Approve',
    pendingLabel: 'Approving…',
  },
  [APPROVAL_ACTION.REJECT]: {
    title: (name) => `Reject ${name}?`,
    description:
      'This is final. A rejected registration cannot be reactivated, and this email address cannot register again. They are told by email.',
    confirmLabel: 'Reject',
    pendingLabel: 'Rejecting…',
    destructive: true,
  },
  [APPROVAL_ACTION.DEACTIVATE]: {
    title: (name) => `Deactivate ${name}?`,
    description:
      'They are signed out at their next request. The account and its history are kept, and no email is sent.',
    confirmLabel: 'Deactivate',
    pendingLabel: 'Deactivating…',
    destructive: true,
  },
}

/**
 * Where a registration sits, as one line: "SM MEGAMALL · CENTRAL NCR", "NCR".
 * Names from the row when the API sends them, else from the lookups.
 *
 * What the place MEANS depends on the tenant (BACKEND.md §3): a Landbank role
 * declares its own group and branch, so this is what they will hold; a
 * PhilLife role picks its approver's group or region, and its own branches or
 * groups are assigned after approval. Either way it is where they registered.
 *
 *   lookups   { groups: [{ GroupCode, GroupName }], regions: [{ RegionCode,
 *             RegionName }], branches: Map(branchCode -> BranchName) }
 *
 * Null when the row carries no place at all.
 */
export function placeOf(row, { groups = [], regions = [], branches = new Map() } = {}) {
  const groupName =
    row.groupName ??
    groups.find((group) => String(group.GroupCode) === String(row.groupCode))?.GroupName ??
    null
  const branchName = row.branchName ?? branches.get(String(row.branchCode)) ?? null
  const regionName =
    row.regionName ??
    regions.find((region) => String(region.RegionCode) === String(row.regionCode))?.RegionName ??
    null

  const parts = [branchName, groupName, regionName].filter(Boolean)
  return parts.length ? parts.join(' · ') : null
}

/** The toast after each action -- one map, so every entry point reads the same. */
const APPROVAL_TOASTS = {
  [APPROVAL_ACTION.APPROVE]: (name) => toast.success(`${name} approved`),
  [APPROVAL_ACTION.REJECT]: (name) => toast.error(`${name} rejected`),
  [APPROVAL_ACTION.DEACTIVATE]: (name) => toast(`${name} deactivated`),
}

export function notifyApproval(action, name) {
  APPROVAL_TOASTS[action]?.(name || 'The account')
}
