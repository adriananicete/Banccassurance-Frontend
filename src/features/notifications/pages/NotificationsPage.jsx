import { useState } from 'react'
import { toast } from 'sonner'

import { NotificationsView } from '../components/NotificationsView'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationCounts,
  useNotifications,
} from '../hooks'

/**
 * GET /notifications, PUT /notifications/:id/read and /mark-all-read.
 *
 * The All / Unread filter and the page live here because both change the
 * request. A mark refetches the list and the counts (the header badge
 * included) before anything else moves; a failure says so in a toast, in the
 * backend's words.
 *
 * Under Unread, reading a row shrinks the set, so the page being read can
 * empty underneath -- usePagedQuery goes back to page 1 rather than showing
 * "no results".
 */
export function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false)

  const list = useNotifications({ unreadOnly })
  const counts = useNotificationCounts()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  return (
    <NotificationsView
      unreadOnly={unreadOnly}
      onUnreadOnlyChange={setUnreadOnly}
      total={counts.total}
      unread={counts.unread}
      rows={list.rows}
      loading={list.isPending && list.fetchStatus !== 'idle'}
      error={list.error}
      page={list.page}
      totalPages={list.totalPages}
      totalCount={list.totalCount}
      pageSize={list.pageSize}
      onPageChange={list.setPage}
      onRead={(row) =>
        markRead.mutate(row.id, { onError: (error) => toast.error(error.message) })
      }
      onMarkAllRead={() =>
        markAllRead.mutate(undefined, {
          onSuccess: () => toast.success('All notifications marked as read'),
          onError: (error) => toast.error(error.message),
        })
      }
      isMarkingAll={markAllRead.isPending}
    />
  )
}
