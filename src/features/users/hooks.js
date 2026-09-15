import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'

import { usePagedQuery } from '@/hooks/usePagedQuery'
import { LOOKUP_STALE_TIME } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'

import { actOnApproval, checkEmail, fetchApprovals, fetchHeadsByRole, register } from './api'
import { APPROVAL_STATUS } from './approvalsUtils'

/** Ten rows a page, like the Reports and Branches tables. */
export const APPROVALS_PAGE_SIZE = 10

/** The approvals queue, paged by the server. A new status or search starts at page 1. */
export function useApprovals({ status, search }) {
  return usePagedQuery({
    key: queryKeys.users.approvals,
    fetcher: fetchApprovals,
    params: { status, search },
    pageSize: APPROVALS_PAGE_SIZE,
  })
}

/**
 * The newest few pending registrations, for the "Awaiting your approval" card.
 * Its own request, so the card keeps showing the queue whatever the table below
 * is filtered to. Shares the approvals key prefix, so an action refreshes it.
 */
export function usePendingApprovals(limit = 5) {
  const params = { status: APPROVAL_STATUS.PENDING, page: 1, pageSize: limit }
  return useQuery({
    queryKey: queryKeys.users.approvals(params),
    queryFn: () => fetchApprovals(params),
  })
}

const COUNTED_STATUSES = [
  APPROVAL_STATUS.PENDING,
  APPROVAL_STATUS.APPROVED,
  APPROVAL_STATUS.REJECTED,
  APPROVAL_STATUS.ALL,
]

/**
 * How many registrations sit under each status, for the status cards.
 *
 * The API has no counts endpoint, so this asks each status for one row and
 * reads `pagination.totalCount`. Four small calls, ignoring the search, so the
 * cards describe the whole queue rather than the filtered page.
 *
 * Returns { PENDING, APPROVED, REJECTED, ALL } -> number | null, plus the
 * first load and the first error.
 */
export function useApprovalCounts() {
  const queries = useQueries({
    queries: COUNTED_STATUSES.map((status) => {
      const params = { status, page: 1, pageSize: 1 }
      return {
        queryKey: queryKeys.users.approvals(params),
        queryFn: () => fetchApprovals(params),
      }
    }),
  })

  const counts = Object.fromEntries(
    COUNTED_STATUSES.map((status, index) => [
      status,
      queries[index].data?.pagination?.totalCount ?? null,
    ]),
  )

  return {
    counts,
    loading: queries.some((query) => query.isPending && query.fetchStatus !== 'idle'),
    error: queries.find((query) => query.error)?.error ?? null,
  }
}

/**
 * Approve, reject or deactivate. On success every approvals list and count is
 * refetched -- the row moves status, so every filter and every card changes.
 */
export function useApprovalAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: actOnApproval,
    // ['users', 'approvals'] -- the prefix of every list and every count.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.users.approvals().slice(0, 2) }),
  })
}

/**
 * The Regional or Area Sales Heads, with photo and scope. Held like reference
 * data: who heads what changes when someone is assigned, not minute to minute.
 */
export function useHeadsByRole(role, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.users.byRole(role),
    queryFn: () => fetchHeadsByRole(role),
    enabled,
    staleTime: LOOKUP_STALE_TIME,
  })
}

export function useRegisterUser() {
  return useMutation({ mutationFn: register })
}

/**
 * Is this address already registered?
 *
 * A courtesy, not a gate. POST /users/register answers 409 for a taken
 * address regardless, and someone else can register it between this check and
 * the submit -- so the answer is a hint, and the 409 is the truth.
 *
 * Held for the session because the answer only changes when somebody
 * registers, and the address is checked once per typing pause rather than
 * once per keystroke: the endpoint is rate-limited by address, 60 per 15
 * minutes in production.
 */
export function useCheckEmail(email) {
  return useQuery({
    queryKey: queryKeys.users.checkEmail(email),
    queryFn: () => checkEmail(email),
    enabled: Boolean(email),
    staleTime: 5 * 60 * 1000,
  })
}
