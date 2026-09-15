/**
 * The Messages screen, reached from the header's message icon (Adrian,
 * 2026-09-15 -- not in the sidebar). A two-pane chat: conversations on the
 * left, the open thread on the right; on a phone one pane at a time.
 *
 * Built from shadcn's chat components (Adrian, 2026-09-15): Message + Bubble
 * for each message, MessageScroller for the thread (it keeps the newest message
 * in view while the reader is at the bottom, leaves them alone when they
 * scroll up, and offers a jump-to-latest button), InputGroup + Textarea for the
 * composer, Empty for the empty states, Avatar for people. Left out on purpose,
 * because the API has none of them: reactions, attachments, typing indicators.
 *
 * Presentational and CONTROLLED -- `pages/MessagesPage.jsx` owns the open
 * conversation (in the URL), the drafts and every request.
 *
 *   me                The signed-in user code, to tell my messages from theirs.
 *   conversations     [{ id, otherUserCode, otherName, otherRole, lastBody, lastAt, lastSenderUserCode, unread }]
 *   listLoading / listError / search / onSearchChange
 *   selected          The open conversation row, or null.   onSelect(row) / onBack()
 *   newChat           { open, onToggle, code, onCodeChange, checking, checkError, person, onStart, starting, startError }
 *   messages          Oldest first.   receipts   { lastDeliveredAt, lastReadAt } | null
 *   threadLoading / threadError / hasOlder / onLoadOlder / loadingOlder
 *   draft / onDraftChange / onSend / sending / sendError
 */
import {
  ArrowUpIcon,
  ChevronLeft,
  MessageCircleDashed,
  MessageSquarePlus,
  MessagesSquare,
  Search,
  X,
} from "lucide-react";

import { DataPlaceholder } from "@/components/DataPlaceholder";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bubble, BubbleContent, BubbleGroup } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group";
import { Message, MessageAvatar, MessageContent, MessageFooter } from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ROLE_LABELS } from "@/constants/roles";
import { formatDate, formatTime, manilaToday, toManilaDay } from "@/lib/datetime";
import { cn } from "@/lib/utils";

/** The body's limit on the server (BACKEND.md §11). */
const MAX_MESSAGE_LENGTH = 4000;

/** "2:45 PM" today, "14 Sep 2026" before. */
function whenLabel(value) {
  if (!value) return "";
  return toManilaDay(value) === manilaToday() ? formatTime(value) : formatDate(value);
}

/**
 * Sent / Delivered / Seen for a message I sent, from the OTHER person's
 * receipts, checked in that order (BACKEND.md §11).
 */
function receiptLabel(message, receipts) {
  if (!receipts) return "Sent";
  const at = new Date(message.createdAt).getTime();
  if (receipts.lastReadAt && new Date(receipts.lastReadAt).getTime() >= at) return "Seen";
  if (receipts.lastDeliveredAt && new Date(receipts.lastDeliveredAt).getTime() >= at) return "Delivered";
  return "Sent";
}

/** Messages from one person closer together than this share a group. */
const GROUP_GAP_MS = 5 * 60 * 1000;

/**
 * Back-to-back messages from the same sender, within five minutes of the one
 * before, as one group: [{ key, senderUserCode, messages }], oldest first.
 */
function groupMessages(messages) {
  const groups = [];
  for (const message of messages) {
    const current = groups.at(-1);
    const previous = current?.messages.at(-1);
    const close =
      previous && new Date(message.createdAt).getTime() - new Date(previous.createdAt).getTime() < GROUP_GAP_MS;
    if (current && current.senderUserCode === message.senderUserCode && close) {
      current.messages.push(message);
    } else {
      groups.push({ key: String(message.id), senderUserCode: message.senderUserCode, messages: [message] });
    }
  }
  return groups;
}

function initialsOf(name) {
  return String(name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/** A person's circle: shadcn Avatar with their initials (the API sends no photo here). */
function PersonAvatar({ name, size = "default" }) {
  return (
    <Avatar size={size}>
      <AvatarFallback className="text-xs font-medium">{initialsOf(name) || "?"}</AvatarFallback>
    </Avatar>
  );
}

export function MessagesView({
  me,
  conversations = [],
  listLoading = false,
  listError = null,
  search,
  onSearchChange,
  selected,
  onSelect,
  onBack,
  newChat,
  messages = [],
  receipts = null,
  threadLoading = false,
  threadError = null,
  hasOlder = false,
  onLoadOlder,
  loadingOlder = false,
  draft,
  onDraftChange,
  onSend,
  sending = false,
  sendError = null,
}) {
  const query = search.trim().toLowerCase();
  const shown = query
    ? conversations.filter((row) =>
        `${row.otherName ?? ""} ${row.otherUserCode ?? ""}`.toLowerCase().includes(query),
      )
    : conversations;

  const lastMineId = [...messages].reverse().find((message) => message.senderUserCode === me)?.id;
  const otherName = selected?.otherName ?? selected?.otherUserCode;

  return (
    <div className="flex w-full flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold md:text-2xl">Messages</h1>
        <p className="text-sm text-muted-foreground">Chat one to one with the people you work with</p>
      </div>

      <Card className="h-[calc(100dvh-14rem)] min-h-[30rem] gap-0 overflow-hidden py-0 lg:grid lg:grid-cols-[20rem_1fr]">
        {/* ── Conversations ───────────────────────────────────────────── */}
        <section
          aria-label="Conversations"
          className={cn("flex min-h-0 flex-col border-r", selected ? "hidden lg:flex" : "flex h-full")}
        >
          <div className="flex flex-col gap-3 border-b p-4">
            <Button
              variant={newChat.open ? "outline" : "default"}
              size="sm"
              onClick={newChat.onToggle}
              className="text-xs"
            >
              {newChat.open ? <X data-icon="inline-start" /> : <MessageSquarePlus data-icon="inline-start" />}
              {newChat.open ? "Cancel" : "New message"}
            </Button>

            {newChat.open ? <NewChatPanel newChat={newChat} /> : null}

            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search conversations"
                aria-label="Search conversations"
                className="pl-8 text-xs md:text-xs"
              />
            </div>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            {listLoading || listError ? (
              <div className="px-4 py-10 text-center">
                <DataPlaceholder
                  loading={listLoading}
                  error={listError}
                  loadingLabel="Loading conversations..."
                  className="text-xs"
                />
              </div>
            ) : shown.length === 0 ? (
              <Empty className="py-10">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MessagesSquare />
                  </EmptyMedia>
                  <EmptyTitle className="text-xs">{query ? "No conversations match" : "No conversations yet"}</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    {query ? "Try another name or user code." : "Start one with New message."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className="divide-y">
                {shown.map((row) => {
                  const isOpen = row.id === selected?.id;
                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(row)}
                        aria-current={isOpen ? "true" : undefined}
                        className={cn(
                          "flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors",
                          isOpen ? "bg-muted" : "hover:bg-muted/50",
                        )}
                      >
                        <PersonAvatar name={row.otherName ?? row.otherUserCode} />
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="flex items-center justify-between gap-2">
                            <span className={cn("truncate text-xs", row.unread > 0 ? "font-semibold" : "font-medium")}>
                              {row.otherName ?? row.otherUserCode}
                            </span>
                            <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                              {whenLabel(row.lastAt)}
                            </span>
                          </span>
                          <span className="flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                "truncate text-[11px]",
                                row.unread > 0 ? "text-foreground" : "text-muted-foreground",
                              )}
                            >
                              {row.lastBody
                                ? `${row.lastSenderUserCode === me ? "You: " : ""}${row.lastBody}`
                                : "No messages yet"}
                            </span>
                            {row.unread > 0 ? (
                              <Badge className="h-4.5 min-w-4.5 shrink-0 rounded-full bg-[#155dfc] px-1.5 text-[10px] text-white tabular-nums">
                                {row.unread > 99 ? "99+" : row.unread}
                              </Badge>
                            ) : null}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
        </section>

        {/* ── Thread ──────────────────────────────────────────────────── */}
        <section
          aria-label="Conversation"
          className={cn("min-h-0 flex-col", selected ? "flex h-full" : "hidden lg:flex")}
        >
          {!selected ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MessageCircleDashed />
                </EmptyMedia>
                <EmptyTitle>No conversation open</EmptyTitle>
                <EmptyDescription className="text-xs">Pick a conversation, or start a new one.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b px-4 py-3">
                <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label="Back to conversations" className="lg:hidden">
                  <ChevronLeft />
                </Button>
                <PersonAvatar name={otherName} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{otherName ?? "Conversation"}</div>
                  <div className="truncate text-[10px] text-muted-foreground">
                    {[ROLE_LABELS[selected?.otherRole], selected?.otherUserCode].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </header>

              {/* Keyed on the conversation, so a new thread opens at its newest message. */}
              <MessageScrollerProvider key={selected?.id} autoScroll defaultScrollPosition="end">
                <MessageScroller className="flex-1 bg-muted/20">
                  <MessageScrollerViewport preserveScrollOnPrepend>
                    <MessageScrollerContent className="gap-3 p-4" aria-busy={threadLoading}>
                      {hasOlder ? (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={onLoadOlder}
                          disabled={loadingOlder}
                          className="mx-auto text-xs text-muted-foreground"
                        >
                          {loadingOlder ? "Loading…" : "Load older messages"}
                        </Button>
                      ) : null}

                      {threadLoading || threadError ? (
                        <div className="py-10 text-center">
                          <DataPlaceholder
                            loading={threadLoading}
                            error={threadError}
                            loadingLabel="Loading messages..."
                            className="text-xs"
                          />
                        </div>
                      ) : messages.length === 0 ? (
                        <Empty>
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <MessageCircleDashed />
                            </EmptyMedia>
                            <EmptyTitle>No messages yet</EmptyTitle>
                            <EmptyDescription className="text-xs">Say hello to {otherName ?? "them"}.</EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      ) : (
                        groupMessages(messages).map((group) => {
                          const mine = group.senderUserCode === me;
                          const last = group.messages.at(-1);
                          return (
                            <MessageScrollerItem key={group.key} messageId={String(last.id)} scrollAnchor={mine}>
                              <Message align={mine ? "end" : "start"}>
                                {mine ? null : (
                                  <MessageAvatar>
                                    <PersonAvatar name={otherName} size="sm" />
                                  </MessageAvatar>
                                )}
                                <MessageContent className="gap-1">
                                  {/* Back-to-back messages from one person share a group, one
                                      avatar and one time line (shadcn BubbleGroup, Adrian). */}
                                  <BubbleGroup className="gap-1">
                                    {group.messages.map((message) => (
                                      <Bubble
                                        key={message.id}
                                        variant={mine ? "default" : "muted"}
                                        align={mine ? "end" : "start"}
                                      >
                                        <BubbleContent className="whitespace-pre-wrap">{message.body}</BubbleContent>
                                      </Bubble>
                                    ))}
                                  </BubbleGroup>
                                  <MessageFooter className="text-[10px] font-normal tabular-nums">
                                    {whenLabel(last.createdAt)}
                                    {mine && last.id === lastMineId ? ` · ${receiptLabel(last, receipts)}` : ""}
                                  </MessageFooter>
                                </MessageContent>
                              </Message>
                            </MessageScrollerItem>
                          );
                        })
                      )}
                    </MessageScrollerContent>
                  </MessageScrollerViewport>
                  <MessageScrollerButton />
                </MessageScroller>
              </MessageScrollerProvider>

              {/* Enter sends, Shift+Enter adds a line; the server trims and refuses an empty body. */}
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  onSend();
                }}
                className="flex flex-col gap-1 border-t p-3"
              >
                <InputGroup>
                  <InputGroupTextarea
                    value={draft}
                    onChange={(event) => onDraftChange(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        onSend();
                      }
                    }}
                    placeholder="Type a message…"
                    aria-label="Message"
                    maxLength={MAX_MESSAGE_LENGTH}
                    disabled={sending}
                    className="max-h-32 min-h-10 text-sm"
                  />
                  <InputGroupAddon align="block-end" className="pt-0">
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {draft.length > MAX_MESSAGE_LENGTH - 200 ? `${draft.length} / ${MAX_MESSAGE_LENGTH}` : ""}
                    </span>
                    <InputGroupButton
                      type="submit"
                      variant="default"
                      size="icon-sm"
                      disabled={sending || !draft.trim()}
                      className="ml-auto"
                    >
                      <ArrowUpIcon />
                      <span className="sr-only">{sending ? "Sending" : "Send"}</span>
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                {sendError ? (
                  <p role="alert" className="text-xs text-destructive">
                    {sendError.message}
                  </p>
                ) : null}
              </form>
            </>
          )}
        </section>
      </Card>
    </div>
  );
}

/**
 * Start a conversation by user code. There is no contacts list yet
 * (BACKEND-REQUESTS R13): the code is checked with /messages/can first, so the
 * person's name and role show before anything is created.
 */
function NewChatPanel({ newChat }) {
  const { code, onCodeChange, checking, checkError, person, onStart, starting, startError } = newChat;

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-medium text-muted-foreground">User code</span>
        <Input
          value={code}
          onChange={(event) => onCodeChange(event.target.value)}
          placeholder="e.g. PHL-AO-00012"
          aria-label="User code"
          className="text-xs md:text-xs"
        />
      </label>

      {checking ? (
        <span className="text-[10px] text-muted-foreground">Checking…</span>
      ) : checkError ? (
        <span className="text-[10px] text-destructive">You cannot message this person.</span>
      ) : person ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <PersonAvatar name={person?.fullName} size="sm" />
            <div className="min-w-0">
              <div className="truncate text-xs font-medium">{person?.fullName ?? person?.userCode}</div>
              <div className="truncate text-[10px] text-muted-foreground">{ROLE_LABELS[person?.role] ?? person?.role}</div>
            </div>
          </div>
          <Button size="xs" onClick={onStart} disabled={starting} className="shrink-0 text-xs">
            {starting ? "Opening…" : "Start chat"}
          </Button>
        </div>
      ) : null}

      {startError ? <span className="text-[10px] text-destructive">{startError.message}</span> : null}
    </div>
  );
}
