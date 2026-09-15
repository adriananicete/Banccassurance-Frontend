import { toast } from 'sonner'

import { ROLES } from '@/constants/roles'

/**
 * The Assignments screen, per signed-in role. Each PhilLife head gives the tier
 * below them what they cover, through one endpoint that REPLACES the whole set
 * (context/BACKEND.md §6):
 *
 *   Area Sales Head      an Account Officer's branches   PUT /users/:id/branches { branchCodes }
 *   Regional Sales Head  an Area Sales Head's groups      PUT /users/:id/groups   { groupCodes }
 *   Department Head      a Regional Sales Head's region   PUT /users/:id/region   { regionCode }
 *
 * Landbank roles are never assigned anything -- their group and branch come
 * from registration. The superadmin can do all three, but is not in this
 * version (Adrian, 2026-09-15).
 */

export const ASSIGNMENT_KIND = {
  BRANCHES: 'branches',
  GROUPS: 'groups',
  REGION: 'region',
}

export const ASSIGNMENT_TIERS = {
  [ROLES.AREA_SALES_HEAD]: {
    kind: ASSIGNMENT_KIND.BRANCHES,
    personRole: ROLES.ACCOUNT_OFFICER,
    person: 'Account Officer',
    people: 'Account Officers',
    unit: 'branch',
    units: 'branches',
    multiple: true,
    // /branches accepts an empty array.
    allowEmpty: true,
    sentence: 'Give each Account Officer the branches they cover',
  },
  [ROLES.REGIONAL_SALES_HEAD]: {
    kind: ASSIGNMENT_KIND.GROUPS,
    personRole: ROLES.AREA_SALES_HEAD,
    person: 'Area Sales Head',
    people: 'Area Sales Heads',
    unit: 'group',
    units: 'groups',
    multiple: true,
    // /groups refuses an empty array: your authority over them comes from a
    // shared group, so emptying it would strand them.
    allowEmpty: false,
    sentence: 'Give each Area Sales Head the groups they cover',
  },
  [ROLES.DEPARTMENT_HEAD]: {
    kind: ASSIGNMENT_KIND.REGION,
    personRole: ROLES.REGIONAL_SALES_HEAD,
    person: 'Regional Sales Head',
    people: 'Regional Sales Heads',
    unit: 'region',
    units: 'regions',
    multiple: false,
    allowEmpty: false,
    sentence: 'Give each Regional Sales Head the region they cover',
  },
}

/** The people-list filter, set by the overview tiles. */
export const PEOPLE_FILTER = {
  ALL: 'ALL',
  NONE: 'NONE',
  ASSIGNED: 'ASSIGNED',
}

/** What was added and removed between the saved set and the draft. */
export function diffCodes(saved = [], draft = []) {
  const before = new Set(saved.map(String))
  const after = new Set(draft.map(String))
  return {
    added: draft.filter((code) => !before.has(String(code))),
    removed: saved.filter((code) => !after.has(String(code))),
  }
}

/** "3 branches", "1 group", "NCR" -- the short line under a person's name. */
export function holdingsSummary(tier, holdings) {
  if (!holdings) return null
  const { codes, items } = holdings
  if (codes.length === 0) return null
  if (!tier.multiple) return items[0]?.name ?? `${codes.length} ${tier.units}`
  const count = `${codes.length} ${codes.length === 1 ? tier.unit : tier.units}`
  const names = items.map((item) => item.name).filter(Boolean)
  return names.length ? `${count} · ${names.join(', ')}` : count
}

export function notifySaved(tier, name) {
  toast.success(`${name || `The ${tier.person}`}'s ${tier.multiple ? tier.units : tier.unit} saved`)
}
