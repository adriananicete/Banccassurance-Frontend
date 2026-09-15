import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { usePagedQuery } from '@/hooks/usePagedQuery'
import { queryKeys } from '@/lib/queryKeys'

import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from './api'

/** Ten a page, like every other list here. */
export const NOTIFICATIONS_PAGE_SIZE = 10

/** How often the header badge asks again while the app is open. */
const BADGE_REFRESH_MS = 60 * 1000

/** The list, paged by the server. Switching All / Unread starts at page 1. */
export function useNotifications({ unreadOnly }) {
  return usePagedQuery({
    key: queryKeys.notifications.list,
    fetcher: fetchNotifications,
    params: { unreadOnly },
    pageSize: NOTIFICATIONS_PAGE_SIZE,
  })
}

/**
 * { total, unread } for the tabs, the page sentence and the header badge. One
 * row asked for, the counts read off the response -- `unreadCount` is the
 * user's whole unread count, not the page's. Refreshed every minute, so the
 * badge moves without a reload.
 */
export function useNotificationCounts() {
  const params = { unreadOnly: false, page: 1, pageSize: 1 }
  const query = useQuery({
    queryKey: queryKeys.notifications.list(params),
    queryFn: () => fetchNotifications(params),
    refetchInterval: BADGE_REFRESH_MS,
  })

  return {
    total: query.data?.pagination?.totalCount ?? null,
    unread: query.data?.unreadCount ?? null,
    loading: query.isPending && query.fetchStatus !== 'idle',
  }
}

/** Both marks refetch every list and the counts -- a read row changes all of them. */
function useInvalidateNotifications() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidateNotifications()
  return useMutation({ mutationFn: markNotificationRead, onSuccess: invalidate })
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotifications()
  return useMutation({ mutationFn: markAllNotificationsRead, onSuccess: invalidate })
}
