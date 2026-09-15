import { apiClient } from '@/lib/apiClient'

/**
 * The seven /messages endpoints (context/BACKEND.md §11). 1:1, text only.
 * Sector Head, Department Head and Superadmin get 403 on all of them -- the
 * app never calls these for those roles.
 *
 * The socket (lib/messagesSocket.js) only saves a refresh. Sends are always
 * HTTP, and these GETs are the truth.
 */

/** GET /messages/unread-count -> number, across every conversation. */
export async function fetchUnreadMessages() {
  const { data } = await apiClient.get('/messages/unread-count')
  return data.total ?? 0
}

/**
 * GET /messages/conversations -> { rows, pagination }
 * Each row: the other person, the last message and how many are unread.
 */
export async function fetchConversations({ page = 1, pageSize = 100 } = {}) {
  const { data } = await apiClient.get('/messages/conversations', { params: { page, pageSize } })
  return {
    rows: (data.data ?? []).map((row) => ({
      id: row.Id,
      otherUserCode: row.OtherUserCode ?? null,
      otherName: row.OtherFullName ?? null,
      otherRole: row.OtherRole ?? null,
      lastBody: row.LastBody ?? null,
      lastAt: row.LastAt ?? null,
      lastSenderUserCode: row.LastSenderUserCode ?? null,
      unread: row.UnreadCount ?? 0,
    })),
    pagination: data.pagination ?? null,
  }
}

/**
 * GET /messages/conversations/:id -> { messages, receipts, pagination }
 *
 * Messages come NEWEST FIRST. `receipts` are the OTHER person's --
 * { lastDeliveredAt, lastReadAt } -- or null when nobody else is in it.
 */
export async function fetchThread(id, { page = 1, pageSize = 30 } = {}) {
  const { data } = await apiClient.get(`/messages/conversations/${id}`, { params: { page, pageSize } })
  return {
    messages: (data.data ?? []).map(toMessage),
    receipts: data.receipts ?? null,
    pagination: data.pagination ?? null,
  }
}

function toMessage(row) {
  return {
    id: row.Id,
    senderUserCode: row.SenderUserCode,
    body: row.Body ?? '',
    createdAt: row.CreatedAt,
  }
}

/** POST /messages/conversations { userCode } -> the conversation (same one every time for a pair). */
export async function openConversation(userCode) {
  const { data } = await apiClient.post('/messages/conversations', { userCode })
  return { id: data.data?.Id }
}

/**
 * POST /messages/conversations/:id { body } -> the message.
 * Refusals are shown as-is: 400 empty or over 4,000 characters, 403 when the
 * relationship has ended (the history stays readable).
 */
export async function sendMessage({ conversationId, body }) {
  const { data } = await apiClient.post(`/messages/conversations/${conversationId}`, { body })
  return toMessage(data.data ?? {})
}

/** PUT /messages/conversations/:id/read */
export async function markConversationRead(conversationId) {
  const { data } = await apiClient.put(`/messages/conversations/${conversationId}/read`)
  return data
}

/**
 * GET /messages/can/:userCode -> { userCode, fullName, role }.
 * 404 for an unknown or deactivated account and 403 for someone out of reach
 * both mean "you cannot message this person".
 */
export async function checkCanMessage(userCode) {
  const { data } = await apiClient.get(`/messages/can/${encodeURIComponent(userCode)}`)
  return data.data
}
