import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useHeadsByRole } from '@/features/users/hooks'
import { queryKeys } from '@/lib/queryKeys'

import { fetchAssignableBranches, fetchHoldings, saveHoldings } from './api'
import { ASSIGNMENT_KIND } from './assignmentsUtils'

/** The cache key for one person's holdings, per tier. */
function holdingsKey(kind, userId) {
  if (kind === ASSIGNMENT_KIND.BRANCHES) return queryKeys.users.branches(userId)
  if (kind === ASSIGNMENT_KIND.GROUPS) return queryKeys.users.groups(userId)
  return queryKeys.users.region(userId)
}

/**
 * What a person holds, from the `scope` GET /users?role= returns for them
 * (context/BACKEND.md §6), in the { codes, items } shape the screen renders.
 */
function holdingsFromScope(kind, scope) {
  if (kind === ASSIGNMENT_KIND.BRANCHES) {
    // An Account Officer: { groupCode, groupName, ..., branches: [...] }.
    const branches = scope?.branches ?? []
    return {
      codes: branches.map((branch) => branch.branchCode),
      items: branches.map((branch) => ({
        code: branch.branchCode,
        name: branch.branchName,
        section: scope?.groupName,
      })),
    }
  }

  if (kind === ASSIGNMENT_KIND.GROUPS) {
    // An Area Sales Head: [{ groupCode, groupName, regionCode, regionName }].
    const groups = scope ?? []
    return {
      codes: groups.map((group) => group.groupCode),
      items: groups.map((group) => ({ code: group.groupCode, name: group.groupName, section: group.regionName })),
    }
  }

  // A Regional Sales Head: { regionCode, regionName } or null; a region of
  // null inside an object means their groups straddle two regions.
  return scope?.regionCode
    ? { codes: [scope.regionCode], items: [{ code: scope.regionCode, name: scope.regionName }] }
    : { codes: [], items: [], straddles: Boolean(scope) }
}

/**
 * The people this head assigns, each with what they hold now -- ONE call,
 * GET /users?role=<the tier below> (R10, 2026-09-15):
 *
 *   Department Head      REGIONAL_SALES_HEAD   scope { regionCode, regionName }
 *   Regional Sales Head  AREA_SALES_HEAD       those registered under the caller's region
 *   Area Sales Head      ACCOUNT_OFFICER       those registered under the caller's groups,
 *                                              with their own group and branches
 *
 * Everyone listed is someone the caller can assign (F11), including people
 * holding nothing. Pending people are left out -- the assign endpoints refuse
 * an account that is not approved.
 *
 * Returns { people: [{ userId, userCode, fullName, photo, groupCode, holdings,
 * holdingsLoading }], loading, error }.
 */
export function useAssignmentPeople(tier) {
  const list = useHeadsByRole(tier.personRole)

  const people = (list.data ?? [])
    .filter((person) => person.approved)
    .map((person) => ({
      userId: person.userId,
      userCode: person.userCode,
      fullName: person.fullName,
      photo: person.photo,
      // An Account Officer's own group: their branches must sit inside it.
      groupCode: tier.kind === ASSIGNMENT_KIND.BRANCHES ? (person.scope?.groupCode ?? null) : null,
      holdings: holdingsFromScope(tier.kind, person.scope),
      holdingsLoading: false,
    }))

  return {
    people,
    loading: list.isPending && list.fetchStatus !== 'idle',
    error: list.error ?? null,
  }
}
/** One person's holdings -- the editor's saved set, read fresh from its own GET. */
export function useHoldings(kind, userId) {
  return useQuery({
    queryKey: holdingsKey(kind, userId),
    queryFn: () => fetchHoldings(kind, userId),
    enabled: userId != null,
  })
}

/** The Area Sales Head's branches, each with who holds it. */
export function useAssignableBranches({ enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.users.assignableBranches(),
    queryFn: fetchAssignableBranches,
    enabled,
  })
}

/**
 * Save a person's whole set. On success the person's holdings, the branch
 * holders and the people list refetch before the caller closes the dialog.
 */
export function useSaveHoldings(kind, personRole) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, codes }) => saveHoldings(kind, userId, codes),
    onSuccess: (_, { userId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: holdingsKey(kind, userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.users.assignableBranches().slice(0, 2) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.users.byRole(personRole) }),
      ]),
  })
}
