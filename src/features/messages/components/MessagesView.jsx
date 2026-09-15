/**
 * The Messages screen, reached from the header's message icon (Adrian,
 * 2026-09-15 -- not in the sidebar). A two-pane chat: conversations on the
 * left, the open thread on the right; on a phone one pane at a time.
 *
 * Presentational and CONTROLLED -- `pages/MessagesPage.jsx` owns the open
 * conversation (in the URL), the drafts and every request. Pure-UI state that
 * lives here: scrolling the thread to its newest message.
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
import { useEffect, useRef } from "react";
import { ChevronLeft, MessageSquarePlus, Search, SendHorizontal, X } from "lucide-react";

import { DataPlaceholder } from "@/components/DataPlaceholder";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ROLE_LABELS } from "@/constants/roles";
import { formatDate, formatTime, manilaToday, toManilaDay } from "@/lib/datetime";
import { cn } from "@/lib/utils";

/** The body's limit on the server (BACKEND.md §11). */
export const MAX_MESSAGE_LENGTH = 4000;

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

  // Keep the newest message in view when one arrives or the thread changes.
  const endRef = useRef(null);
  const lastId = messages.at(-1)?.id;
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lastId, selected?.id]);

  const lastMine = [...messages].reverse().find((message) => message.senderUserCode === me);

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
            {listLoading || listError || shown.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <DataPlaceholder
                  loading={listLoading}
                  error={listError}
                  empty={query ? "No conversations match." : "No conversations yet. Start one with New message."}
                  loadingLabel="Loading conversations..."
                  className="text-xs"
                />
              </div>
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
                        <UserAvatar name={row.otherName ?? row.otherUserCode} size="md" />
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
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
              <span
                aria-hidden
                className="inline-flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
              >
                <MessageSquarePlus className="size-5" />
              </span>
              <span className="text-xs text-muted-foreground">Pick a conversation, or start a new one.</span>
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b px-4 py-3">
                <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label="Back to conversations" className="lg:hidden">
                  <ChevronLeft />
                </Button>
                <UserAvatar name={selected.otherName ?? selected.otherUserCode} size="md" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{selected.otherName ?? selected.otherUserCode}</div>
                  <div className="truncate text-[10px] text-muted-foreground">
                    {[ROLE_LABELS[selected.otherRole], selected.otherUserCode].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </header>

              <ScrollArea className="min-h-0 flex-1 bg-muted/20">
                <div className="flex flex-col gap-2 px-4 py-4">
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

                  {threadLoading || threadError || messages.length === 0 ? (
                    <div className="py-10 text-center">
                      <DataPlaceholder
                        loading={threadLoading}
                        error={threadError}
                        empty="No messages yet. Say hello."
                        loadingLabel="Loading messages..."
                        className="text-xs"
                      />
                    </div>
                  ) : (
                    messages.map((message) => {
                      const mine = message.senderUserCode === me;
                      return (
                        <div key={message.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                          <div
                            className={cn(
                              "max-w-[75%] rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap",
                              mine
                                ? "rounded-br-sm bg-primary text-primary-foreground"
                                : "rounded-bl-sm border bg-card text-card-foreground",
                            )}
                          >
                            {message.body}
                          </div>
                          <span className="mt-0.5 px-1 text-[10px] text-muted-foreground tabular-nums">
                            {whenLabel(message.createdAt)}
                            {mine && message.id === lastMine?.id ? ` · ${receiptLabel(message, receipts)}` : ""}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={endRef} />
                </div>
              </ScrollArea>

              {/* Enter sends; the server trims and refuses an empty body. */}
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  onSend();
                }}
                className="flex flex-col gap-1 border-t p-3"
              >
                <div className="flex items-center gap-2">
                  <Input
                    value={draft}
                    onChange={(event) => onDraftChange(event.target.value)}
                    placeholder="Type a message…"
                    aria-label="Message"
                    maxLength={MAX_MESSAGE_LENGTH}
                    disabled={sending}
                    className="text-sm"
                  />
                  <Button type="submit" disabled={sending || !draft.trim()} className="text-xs">
                    <SendHorizontal data-icon="inline-start" />
                    {sending ? "Sending…" : "Send"}
                  </Button>
                </div>
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
            <UserAvatar name={person.fullName} size="sm" />
            <div className="min-w-0">
              <div className="truncate text-xs font-medium">{person.fullName ?? person.userCode}</div>
              <div className="truncate text-[10px] text-muted-foreground">{ROLE_LABELS[person.role] ?? person.role}</div>
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
