import { useCallback, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

export const DEFAULT_PAGE_SIZE = 20

/** Every paged endpoint in this API caps pageSize at 100. */
export const MAX_PAGE_SIZE = 100

/**
 * Paging, with the API's one structural quirk handled in a single place.
 *
 * A PAGE PAST THE END REPORTS `totalCount: 0` AND `totalPages: 0`, not the
 * real total. The count rides on the rows, so a page with no rows carries no
 * count. This applies to every paged list here and is reachable in ordinary
 * use -- under `?unreadOnly=true` the set shrinks as the user reads, so the
 * page they are standing on can empty underneath them.
 *
 * Rendering that as "no results" is wrong twice over: the list is not empty,
 * and the pager now says there is one page when there are seven. So when a
 * page above the first comes back with no rows, this hook goes back to page 1
 * and refetches rather than reporting an empty state.
 *
 * `fetcher` receives `{ ...params, page, pageSize }` and must return
 * `{ rows, pagination }`. Normalising to that shape is each feature's job --
 * the API is not uniform (GET /notifications puts its list under
 * `notifications`, everything else under `data`) and this hook does not guess.
 *
 * Both page corrections below happen DURING RENDER rather than in an effect.
 * React re-runs the component immediately and never commits the discarded
 * pass, so there is no flash of the wrong page and no cascading render. Both
 * are self-terminating: each sets page to 1, and neither condition can hold
 * when page is already 1.
 */
export function usePagedQuery({
  key,
  fetcher,
  params = {},
  pageSize = DEFAULT_PAGE_SIZE,
  enabled = true,
  ...queryOptions
}) {
  const [page, setPage] = useState(1)

  // A filter change invalidates the current page number: page 5 of an
  // unfiltered list is rarely page 5 of a filtered one.
  const signature = `${JSON.stringify(params)}|${pageSize}`
  const [lastSignature, setLastSignature] = useState(signature)
  if (lastSignature !== signature) {
    setLastSignature(signature)
    if (page !== 1) setPage(1)
  }

  const requestParams = { ...params, page, pageSize: Math.min(pageSize, MAX_PAGE_SIZE) }

  const query = useQuery({
    queryKey: key(requestParams),
    queryFn: () => fetcher(requestParams),
    placeholderData: keepPreviousData,
    enabled,
    ...queryOptions,
  })

  const rows = query.data?.rows ?? []
  const pagination = query.data?.pagination ?? null

  // Landed past the end. `pagination` is reporting zeroes that are not real,
  // so do not read totals from it -- just go back and refetch.
  const isPastEnd = Boolean(query.isSuccess && !query.isFetching && page > 1 && rows.length === 0)
  if (isPastEnd) setPage(1)

  const goToPage = useCallback((next) => {
    setPage(Math.max(1, Math.trunc(next) || 1))
  }, [])

  return {
    ...query,
    rows,
    pagination,
    page,
    pageSize,
    setPage: goToPage,
    totalCount: pagination?.totalCount ?? 0,
    totalPages: pagination?.totalPages ?? 0,
    hasPrevious: page > 1,
    hasNext: Boolean(pagination && page < pagination.totalPages),
  }
}
