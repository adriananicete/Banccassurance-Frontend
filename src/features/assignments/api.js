import { apiClient } from '@/lib/apiClient'

import { ASSIGNMENT_KIND } from './assignmentsUtils'

/**
 * The assign endpoints (context/BACKEND.md §6). Every GET answers the key its
 * PUT takes, and every PUT REPLACES THE WHOLE SET -- always send the complete
 * list the person should end up holding, never just the change.
 *
 * Holdings are normalised to { codes: number[], items: [{ code, name, section }] }
 * whatever the tier, so the screen has one shape to render.
 */

function toHoldings(kind, data) {
  if (kind === ASSIGNMENT_KIND.BRANCHES) {
    return {
      codes: data.branchCodes ?? [],
      items: (data.branches ?? []).map((branch) => ({
        code: branch.branchCode,
        name: branch.branchName,
        section: branch.groupName,
      })),
    }
  }

  if (kind === ASSIGNMENT_KIND.GROUPS) {
    return {
      codes: data.groupCodes ?? [],
      items: (data.groups ?? []).map((group) => ({
        code: group.groupCode,
        name: group.groupName,
        section: group.regionName,
      })),
    }
  }

  // REGION. ⚠️ `regionCode` is null when the head's groups straddle two
  // regions (older rows); the groups are still right, so say that instead of
  // "nothing".
  const groupCodes = data.groupCodes ?? []
  if (data.regionCode != null) {
    return { codes: [data.regionCode], items: [{ code: data.regionCode, name: data.regionName }] }
  }
  return {
    codes: [],
    items: [],
    straddles: groupCodes.length > 0,
  }
}

/** GET /users/:userId/branches | /groups | /region */
export async function fetchHoldings(kind, userId) {
  const { data } = await apiClient.get(`/users/${userId}/${kind}`)
  return toHoldings(kind, data.data ?? {})
}

/**
 * PUT /users/:userId/branches | /groups | /region -> the resulting set.
 *
 * Refusals carry the backend's message and are shown as-is: 409 a branch
 * another officer holds, 400 a branch outside the officer's group, 400 an
 * empty group list, 403 codes outside your own scope.
 */
export async function saveHoldings(kind, userId, codes) {
  const body =
    kind === ASSIGNMENT_KIND.BRANCHES
      ? { branchCodes: codes }
      : kind === ASSIGNMENT_KIND.GROUPS
        ? { groupCodes: codes }
        : { regionCode: codes[0] }
  const { data } = await apiClient.put(`/users/${userId}/${kind}`, body)
  return data.data
}

/**
 * GET /users/assignable-branches -> every branch in the Area Sales Head's
 * groups, with `aoCode`: null is free, otherwise the Account Officer holding it.
 */
export async function fetchAssignableBranches() {
  const { data } = await apiClient.get('/users/assignable-branches')
  return (data.data ?? []).map((branch) => ({
    code: branch.branchCode,
    name: branch.branchName,
    section: branch.groupName,
    groupCode: branch.groupCode,
    note: branch.clusterName,
    holder: branch.aoCode,
  }))
}
