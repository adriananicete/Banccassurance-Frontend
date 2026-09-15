import { apiClient } from '@/lib/apiClient'

/**
 * The /notifications endpoints. All are keyed by the session's UserCode; none
 * takes a user code from the query or body (context/BACKEND.md §10).
 */

/**
 * GET /notifications -> { rows, pagination, unreadCount }
 *
 * ⚠️ THE LIST KEY IS `notifications`, NOT `data` -- the one list in this API
 * that is not `data`.
 *
 * ⚠️ `unreadCount` IS EVERY UNREAD THE USER HAS, not the unread on this page, so
 * the badge reads it rather than counting the array. Like the total, it rides
 * on the rows: a page past the end reports 0 for both (usePagedQuery handles it).
 *
 * A row is { Id, UserCode, Message, IsRead, CreatedAt } and nothing else -- no
 * type, no category, no link to the record it is about.
 *
 *   unreadOnly   Sent as the string "true"; anything else is no filter.
 */
export async function fetchNotifications({ unreadOnly = false, page, pageSize }) {
  const { data } = await apiClient.get('/notifications', {
    params: { unreadOnly: unreadOnly ? 'true' : undefined, page, pageSize },
  })
  return {
    rows: (data.notifications ?? []).map((row) => ({
      id: row.Id,
      message: row.Message ?? '',
      isRead: Boolean(row.IsRead),
      createdAt: row.CreatedAt ?? null,
    })),
    pagination: data.pagination ?? null,
    unreadCount: data.unreadCount ?? 0,
  }
}

/** PUT /notifications/:id/read. `id` is the integer id. Marking one already read is harmless. */
export async function markNotificationRead(id) {
  const { data } = await apiClient.put(`/notifications/${id}/read`)
  return data
}

/** PUT /notifications/mark-all-read. */
export async function markAllNotificationsRead() {
  const { data } = await apiClient.put('/notifications/mark-all-read')
  return data
}
