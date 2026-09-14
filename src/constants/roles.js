/**
 * The nine roles, and the groupings the UI actually branches on.
 *
 * Source: context/BACKEND.md section 3. Every value here is a string the API
 * sends and receives -- do not translate them, only ROLE_LABELS is for reading.
 */

export const ROLES = {
  // Landbank -- USR- prefix
  SECTOR_HEAD: 'SECTOR_HEAD',
  GROUP_HEAD: 'GROUP_HEAD',
  BRANCH_HEAD: 'BRANCH_HEAD',
  BRANCH_STAFF: 'BRANCH_STAFF',

  // PhilLife -- PHL- prefix
  DEPARTMENT_HEAD: 'DEPARTMENT_HEAD',
  REGIONAL_SALES_HEAD: 'REGIONAL_SALES_HEAD',
  AREA_SALES_HEAD: 'AREA_SALES_HEAD',
  ACCOUNT_OFFICER: 'ACCOUNT_OFFICER',

  // Neither company -- SYS- prefix, held by IT
  SUPERADMIN: 'SUPERADMIN',
}

export const ROLE_LABELS = {
  [ROLES.SECTOR_HEAD]: 'Sector Head',
  [ROLES.GROUP_HEAD]: 'Group Head',
  [ROLES.BRANCH_HEAD]: 'Branch Head',
  [ROLES.BRANCH_STAFF]: 'Branch Staff',
  [ROLES.DEPARTMENT_HEAD]: 'Department Head',
  [ROLES.REGIONAL_SALES_HEAD]: 'Regional Sales Head',
  [ROLES.AREA_SALES_HEAD]: 'Area Sales Head',
  [ROLES.ACCOUNT_OFFICER]: 'Account Officer',
  [ROLES.SUPERADMIN]: 'Superadmin',
}

export const TENANTS = {
  LANDBANK: 'USR',
  PHILLIFE: 'PHL',
  SYSTEM: 'SYS',
}

/**
 * Three of the nine. Everyone else reads and oversees.
 *
 * Note the asymmetry: on the Landbank side a Branch Head refers alongside
 * their staff; on the PhilLife side an Account Officer's own head does not.
 *
 * The API refuses the other six with a 403 either way -- this list is so the
 * create button is hidden rather than always failing on click.
 */
export const REFERRAL_CREATOR_ROLES = [
  ROLES.BRANCH_STAFF,
  ROLES.BRANCH_HEAD,
  ROLES.ACCOUNT_OFFICER,
]

/** Only an Account Officer may move a referral along, and only their own. */
export const STATUS_UPDATER_ROLES = [ROLES.ACCOUNT_OFFICER]

/** Roles that reach GET /users/approvals at all. Each approves only the tier below it. */
export const APPROVER_ROLES = [
  ROLES.BRANCH_HEAD,
  ROLES.GROUP_HEAD,
  ROLES.SECTOR_HEAD,
  ROLES.DEPARTMENT_HEAD,
  ROLES.REGIONAL_SALES_HEAD,
  ROLES.AREA_SALES_HEAD,
  ROLES.SUPERADMIN,
]

/**
 * 403 on all seven /messages endpoints, and their socket handshake is refused.
 * Hide the icon for them rather than letting it fail on click.
 */
export const MESSAGING_DENIED_ROLES = [
  ROLES.SECTOR_HEAD,
  ROLES.DEPARTMENT_HEAD,
  ROLES.SUPERADMIN,
]

/**
 * No referral list for these. A superadmin never reads referrals. The Sector
 * Head and Department Head CAN read their tenant's list through the API, but
 * they oversee from the dashboard and reports rather than working referrals
 * one by one, so the Referrals screen is not theirs (Adrian, 2026-09-14).
 * This is a UI choice, not an API refusal.
 */
export const REFERRAL_LIST_DENIED_ROLES = [
  ROLES.SECTOR_HEAD,
  ROLES.DEPARTMENT_HEAD,
  ROLES.SUPERADMIN,
]

/** GET /audit is superadmin only -- including the roles that write rows to it. */
export const AUDIT_ROLES = [ROLES.SUPERADMIN]

/** Deactivate and reactivate. The route lets every approver through; the service refuses. */
export const MEMBERSHIP_ACTION_ROLES = [ROLES.SUPERADMIN]

/** Who may call each of the three assign endpoints. */
export const ASSIGN_BRANCHES_ROLES = [ROLES.AREA_SALES_HEAD, ROLES.SUPERADMIN]
export const ASSIGN_GROUPS_ROLES = [ROLES.REGIONAL_SALES_HEAD, ROLES.SUPERADMIN]
export const ASSIGN_REGION_ROLES = [ROLES.DEPARTMENT_HEAD, ROLES.SUPERADMIN]

/**
 * The eight that may self-register. SUPERADMIN is seeded, never registered,
 * and answers 400 -- it must never appear in a registration dropdown.
 */
export const REGISTERABLE_ROLES = [
  ROLES.BRANCH_STAFF,
  ROLES.BRANCH_HEAD,
  ROLES.GROUP_HEAD,
  ROLES.SECTOR_HEAD,
  ROLES.ACCOUNT_OFFICER,
  ROLES.AREA_SALES_HEAD,
  ROLES.REGIONAL_SALES_HEAD,
  ROLES.DEPARTMENT_HEAD,
]

/**
 * The eight, split by company.
 *
 * The tenant is not a field anyone sends -- the backend derives it from the
 * role and stamps it into the UserCode prefix. These lists exist so the
 * registration screen can ask which company someone belongs to first and then
 * offer four roles instead of eight.
 */
export const LANDBANK_REGISTERABLE_ROLES = [
  ROLES.BRANCH_STAFF,
  ROLES.BRANCH_HEAD,
  ROLES.GROUP_HEAD,
  ROLES.SECTOR_HEAD,
]

export const PHILLIFE_REGISTERABLE_ROLES = [
  ROLES.ACCOUNT_OFFICER,
  ROLES.AREA_SALES_HEAD,
  ROLES.REGIONAL_SALES_HEAD,
  ROLES.DEPARTMENT_HEAD,
]

/**
 * The slugs the registration URL uses, and what each means.
 *
 * `SYS` is deliberately absent: a superadmin is seeded, never registered, and
 * POST /users/register answers 400 for it.
 */
export const TENANT_SLUGS = {
  landbank: TENANTS.LANDBANK,
  phillife: TENANTS.PHILLIFE,
}

export const TENANT_LABELS = {
  [TENANTS.LANDBANK]: 'Landbank',
  [TENANTS.PHILLIFE]: 'PhilLife',
  [TENANTS.SYSTEM]: 'System',
}

/** The roles someone at this tenant may register as. Empty for anything else. */
export function registerableRolesForTenant(tenant) {
  if (tenant === TENANTS.LANDBANK) return LANDBANK_REGISTERABLE_ROLES
  if (tenant === TENANTS.PHILLIFE) return PHILLIFE_REGISTERABLE_ROLES
  return []
}

/**
 * Which code field each role sends at registration. Sending a forbidden one is
 * a 400. Mirrors context/BACKEND.md section 6 -- schemas/register.js enforces it.
 *
 * What you pick at registration is your approver's scope, never your own.
 */
export const REGISTRATION_FIELDS = {
  [ROLES.BRANCH_STAFF]: { groupCode: 'optional', branchCode: 'required', regionCode: 'forbidden' },
  [ROLES.BRANCH_HEAD]: { groupCode: 'required', branchCode: 'required', regionCode: 'forbidden' },
  [ROLES.GROUP_HEAD]: { groupCode: 'required', branchCode: 'forbidden', regionCode: 'forbidden' },
  [ROLES.ACCOUNT_OFFICER]: { groupCode: 'required', branchCode: 'forbidden', regionCode: 'forbidden' },
  [ROLES.AREA_SALES_HEAD]: { groupCode: 'forbidden', branchCode: 'forbidden', regionCode: 'required' },
  [ROLES.REGIONAL_SALES_HEAD]: { groupCode: 'forbidden', branchCode: 'forbidden', regionCode: 'forbidden' },
  [ROLES.SECTOR_HEAD]: { groupCode: 'forbidden', branchCode: 'forbidden', regionCode: 'forbidden' },
  [ROLES.DEPARTMENT_HEAD]: { groupCode: 'forbidden', branchCode: 'forbidden', regionCode: 'forbidden' },
}

/** What GET /users/scope reports about how far a role reaches. */
export const REACH = {
  /** Holds everything in the tenant. Empty arrays are CORRECT, not a blocking state. */
  TENANT: 'TENANT',
  /** Holds what is listed. Empty means holds nothing -- a real blocking state. */
  ASSIGNED: 'ASSIGNED',
  /** Sees their own referrals; the branch is where they sit. */
  SELF: 'SELF',
}

export function hasRole(role, allowed) {
  return Boolean(role) && allowed.includes(role)
}

export function tenantOf(userCode) {
  if (typeof userCode !== 'string') return null
  const prefix = userCode.slice(0, 3)
  return Object.values(TENANTS).includes(prefix) ? prefix : null
}
