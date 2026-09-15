import { usePagedQuery } from '@/hooks/usePagedQuery'
import { queryKeys } from '@/lib/queryKeys'

import { fetchReferrals } from './api'

/**
 * The referral list, paged by the server. A new filter starts at page 1.
 * `enabled` lets a screen hold the request while its filter is incomplete.
 */
export function useReferrals({ status, dateFrom, dateTo, search }, { pageSize = 10, enabled = true } = {}) {
  return usePagedQuery({
    key: queryKeys.referrals.list,
    fetcher: fetchReferrals,
    params: { status, dateFrom, dateTo, search },
    pageSize,
    enabled,
  })
}
