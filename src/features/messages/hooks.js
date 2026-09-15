import { useEffect } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { connectMessagesSocket, disconnectMessagesSocket } from '@/lib/messagesSocket'
import { queryKeys } from '@/lib/queryKeys'

import {
  checkCanMessage,
  fetchConversations,
  fetchThread,
  fetchUnreadMessages,
  markConversationRead,
  openConversation,
  sendMessage,
} from './api'

/** A fallback refresh in case the socket is down; the socket is the fast path. */
const FALLBACK_REFRESH_MS = 60 * 1000
const THREAD_PAGE_SIZE = 30

/** Every unread message, for the header badge. */
export function useUnreadMessages({ enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.messages.unreadCount,
    queryFn: fetchUnreadMessages,
    enabled,
    refetchInterval: FALLBACK_REFRESH_MS,
  })
}

/** The conversation list, newest activity first as the API orders it. */
export function useConversations() {
  return useQuery({
    queryKey: queryKeys.messages.conversations({ page: 1, pageSize: 100 }),
    queryFn: () => fetchConversations({ page: 1, pageSize: 100 }),
    refetchInterval: FALLBACK_REFRESH_MS,
  })
}

/**
 * One conversation, paged from the newest. `fetchNextPage` loads OLDER
 * messages. Pages come newest first; the screen reverses them to read top to
 * bottom.
 */
export function useThread(conversationId) {
  return useInfiniteQuery({
    queryKey: queryKeys.messages.conversation(conversationId, { pageSize: THREAD_PAGE_SIZE }),
    queryFn: ({ pageParam }) => fetchThread(conversationId, { page: pageParam, pageSize: THREAD_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination && last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
    enabled: conversationId != null,
  })
}

function useInvalidateMessages() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.messages.all })
}

export function useSendMessage() {
  const invalidate = useInvalidateMessages()
  return useMutation({ mutationFn: sendMessage, onSuccess: invalidate })
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markConversationRead,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.messages.unreadCount }),
        queryClient.invalidateQueries({ queryKey: queryKeys.messages.conversations().slice(0, 2) }),
      ]),
  })
}

export function useOpenConversation() {
  const invalidate = useInvalidateMessages()
  return useMutation({ mutationFn: openConversation, onSuccess: invalidate })
}

/** Can I message this user code? Asked only once a code is entered. */
export function useCanMessage(userCode) {
  return useQuery({
    queryKey: queryKeys.messages.canMessage(userCode),
    queryFn: () => checkCanMessage(userCode),
    enabled: Boolean(userCode),
    retry: false,
  })
}

/**
 * Connects the chat socket while `enabled` and turns its two events into
 * refetches: `message:new` refreshes the list, the badge and the thread it
 * belongs to; `message:read` refreshes that thread's receipts ("Seen").
 */
export function useMessagesSocket(enabled) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return undefined

    const socket = connectMessagesSocket()
    const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.messages.all })

    socket.on('message:new', refresh)
    socket.on('message:read', refresh)

    return () => {
      socket.off('message:new', refresh)
      socket.off('message:read', refresh)
      disconnectMessagesSocket()
    }
  }, [enabled, queryClient])
}
