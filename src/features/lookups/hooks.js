import { useQuery } from '@tanstack/react-query'

import { LOOKUP_STALE_TIME } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'

import { fetchBranches, fetchGroups, fetchPlans, fetchRegions } from './api'

/**
 * Reference data changes on the scale of months, so it is held for an hour.
 * Without that, every mount of a form with three dropdowns is three requests
 * for rows that have not moved.
 */

export function useRegions({ enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.lookups.regions,
    queryFn: fetchRegions,
    enabled,
    staleTime: LOOKUP_STALE_TIME,
  })
}

export function useGroups({ enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.lookups.groups,
    queryFn: fetchGroups,
    enabled,
    staleTime: LOOKUP_STALE_TIME,
  })
}

/**
 * Branches for one group.
 *
 * `groupCode` is required rather than optional: 136 branches against a page
 * cap of 100 means an unfiltered call returns a partial list that looks
 * complete. Disabled until a group is chosen, so the caller must cascade.
 */
export function useBranches(groupCode, { search } = {}) {
  return useQuery({
    queryKey: queryKeys.lookups.branches({ groupCode, search }),
    queryFn: () => fetchBranches({ groupCode, search }),
    enabled: Boolean(groupCode),
    staleTime: LOOKUP_STALE_TIME,
    select: (result) => result.rows,
  })
}

export function usePlans() {
  return useQuery({
    queryKey: queryKeys.lookups.plans,
    queryFn: fetchPlans,
    staleTime: LOOKUP_STALE_TIME,
  })
}
