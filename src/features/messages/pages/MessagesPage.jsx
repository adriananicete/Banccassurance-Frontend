import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'

import { useAuth } from '@/features/auth/AuthContext'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

import { MessagesView } from '../components/MessagesView'
import {
  useCanMessage,
  useConversations,
  useMarkConversationRead,
  useOpenConversation,
  useSendMessage,
  useThread,
} from '../hooks'

/**
 * /messages -- the header's message icon (Adrian, 2026-09-15).
 *
 * The open conversation lives in the URL (`?c=<id>`), so Back, a refresh and a
 * shared link all land on the same thread. `?to=<userCode>` opens (or finds)
 * the conversation with that person -- for starting a chat from a name
 * elsewhere in the app.
 *
 * Reading marks read: whenever the open conversation shows unread messages,
 * PUT /read runs, which also tells the sender "Seen" over the socket.
 */
export function MessagesPage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const openId = params.get('c')
  const openWith = params.get('to')

  const [search, setSearch] = useState('')
  const [newOpen, setNewOpen] = useState(false)
  const [code, setCode] = useState('')
  const checkedCode = useDebouncedValue(code.trim().toUpperCase(), 400)
  // One draft per conversation, so switching threads keeps what was typed.
  const [drafts, setDrafts] = useState({})

  const conversations = useConversations()
  const rows = conversations.data?.rows ?? []
  // A conversation just opened may not be in the list yet -- show its thread anyway.
  const selected = openId
    ? (rows.find((row) => String(row.id) === String(openId)) ?? { id: openId, otherName: null, otherUserCode: null })
    : null

  const thread = useThread(openId)
  const pages = thread.data?.pages ?? []
  const messages = pages.flatMap((page) => page.messages).reverse()
  const receipts = pages[0]?.receipts ?? null

  const markRead = useMarkConversationRead()
  const send = useSendMessage()
  const open = useOpenConversation()
  const can = useCanMessage(newOpen ? checkedCode : '')

  const unreadHere = selected?.unread ?? 0
  const markReadMutate = markRead.mutate
  useEffect(() => {
    if (openId && unreadHere > 0) markReadMutate(openId)
  }, [openId, unreadHere, markReadMutate])

  // ?to=<userCode>: open that conversation once, then show it by id.
  const openMutate = open.mutate
  useEffect(() => {
    if (!openWith) return
    openMutate(openWith, {
      onSuccess: (conversation) => setParams({ c: String(conversation?.id) }, { replace: true }),
      onError: () => setParams({}, { replace: true }),
    })
  }, [openWith, openMutate, setParams])

  const draft = openId ? (drafts[openId] ?? '') : ''

  return (
    <MessagesView
      me={user?.userCode}
      conversations={rows}
      listLoading={conversations.isPending && conversations.fetchStatus !== 'idle'}
      listError={conversations.error}
      search={search}
      onSearchChange={setSearch}
      selected={selected}
      onSelect={(row) => {
        send.reset()
        setParams({ c: String(row?.id) })
      }}
      onBack={() => setParams({})}
      newChat={{
        open: newOpen,
        onToggle: () => {
          setNewOpen((value) => !value)
          setCode('')
          open.reset()
        },
        code,
        onCodeChange: setCode,
        checking: Boolean(checkedCode) && can.isFetching,
        checkError: checkedCode ? can.error : null,
        person: checkedCode ? (can.data ?? null) : null,
        onStart: () => {
          if (!can.data?.userCode) return
          open.mutate(can.data?.userCode, {
            onSuccess: (conversation) => {
              setNewOpen(false)
              setCode('')
              setParams({ c: String(conversation?.id) })
            },
          })
        },
        starting: open.isPending,
        startError: open.error,
      }}
      messages={messages}
      receipts={receipts}
      threadLoading={thread.isPending && thread.fetchStatus !== 'idle'}
      threadError={thread.error}
      hasOlder={Boolean(thread.hasNextPage)}
      onLoadOlder={() => thread.fetchNextPage()}
      loadingOlder={thread.isFetchingNextPage}
      draft={draft}
      onDraftChange={(value) => {
        if (openId) setDrafts((current) => ({ ...current, [openId]: value }))
      }}
      onSend={() => {
        const body = draft.trim()
        if (!openId || !body) return
        send.mutate(
          { conversationId: openId, body },
          { onSuccess: () => setDrafts((current) => ({ ...current, [openId]: '' })) },
        )
      }}
      sending={send.isPending}
      sendError={send.error}
    />
  )
}
