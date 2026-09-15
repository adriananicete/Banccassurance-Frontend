/**
 * The Notifications screen, reached from the bell in the header (Adrian,
 * 2026-09-15 -- it left the sidebar).
 *
 * Built on Adrian's screenshots/notifications.png: a title with the unread
 * count in words and "Mark all as read" on the right; an All / Unread switch
 * with a count in each; then one card -- a muted instruction over a hairline,
 * the list in a scroll area, and a grey footer band with "Showing X–Y of Z"
 * and Previous / Page N of M / Next. An unread row sits on a faint blue with a
 * blue dot and a "new" pill; a read row is plain.
 *
 * Differences from the screenshot, because of the data (BACKEND.md §10): a
 * notification is only { id, message, isRead, createdAt }. There is no
 * category, no type ("info") and no record to jump to, so the second line is
 * the time alone and a click only marks the row read.
 *
 * Presentational and CONTROLLED -- `pages/NotificationsPage.jsx` owns the
 * filter and the page and runs the marks.
 *
 *   unreadOnly / onUnreadOnlyChange
 *   total / unread       Counts for the tabs and the sentence; null while unknown.
 *   rows                 [{ id, message, isRead, createdAt }]
 *   loading / error
 *   page / totalPages / totalCount / pageSize / onPageChange
 *   onRead(row)          A row clicked. Only unread rows call it.
 *   onMarkAllRead / isMarkingAll
 */
import { CheckCheck, Inbox } from "lucide-react";

import { DataPlaceholder } from "@/components/DataPlaceholder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatRelative } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import { formatCount } from "@/features/reports/dashboardFormat";

/** A week, in ms. Newer than this reads "3d ago"; older, the date. */
const RELATIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function whenLabel(createdAt) {
  const time = createdAt ? new Date(createdAt).getTime() : NaN;
  if (Number.isNaN(time)) return "—";
  return Date.now() - time < RELATIVE_WINDOW_MS ? formatRelative(createdAt) : formatDate(createdAt);
}

export function NotificationsView({
  unreadOnly,
  onUnreadOnlyChange,
  total,
  unread,
  rows = [],
  loading = false,
  error = null,
  page,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onRead,
  onMarkAllRead,
  isMarkingAll = false,
}) {
  const isEmpty = loading || error || rows.length === 0;
  const pageCount = Math.max(1, totalPages);

  const sentence =
    unread == null
      ? "Your notifications."
      : unread === 0
        ? "You're all caught up."
        : `You have ${formatCount(unread)} unread notification${unread === 1 ? "" : "s"}.`;

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold md:text-2xl">Notifications</h1>
          <p className="text-sm text-muted-foreground">{sentence}</p>
        </div>
        <Button
          variant="outline"
          onClick={onMarkAllRead}
          disabled={!unread || isMarkingAll}
          className="text-xs"
        >
          <CheckCheck data-icon="inline-start" />
          {isMarkingAll ? "Marking…" : "Mark all as read"}
        </Button>
      </div>

      {/* All / Unread -- shadcn Tabs as a control, restyled to the screenshot:
          a bordered pill, the picked one filled dark with its count on a light
          chip. */}
      <Tabs
        value={unreadOnly ? "unread" : "all"}
        onValueChange={(value) => onUnreadOnlyChange(value === "unread")}
        className="w-fit"
      >
        <TabsList aria-label="Show" className="gap-1 border bg-card p-1 group-data-horizontal/tabs:h-auto">
          <FilterTab value="all" label="All" count={total} />
          <FilterTab value="unread" label="Unread" count={unread} />
        </TabsList>
      </Tabs>

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b py-4 [.border-b]:pb-4">
          <p className="text-xs text-muted-foreground">Click a notification to mark it as read.</p>
        </CardHeader>

        <CardContent className="px-0">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
              {loading || error ? (
                <DataPlaceholder
                  loading={loading}
                  error={error}
                  loadingLabel="Loading notifications..."
                  className="text-xs"
                />
              ) : (
                <>
                  <span
                    aria-hidden
                    className="inline-flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
                  >
                    <Inbox className="size-5" />
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {unreadOnly ? "No unread notifications." : "You have no notifications yet."}
                  </span>
                </>
              )}
            </div>
          ) : (
            // Ten rows show; the rest of a page scrolls inside the card.
            <ScrollArea className="[&_[data-slot=scroll-area-viewport]]:max-h-[34rem]">
              <ul className="divide-y">
                {rows.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!row.isRead) onRead(row);
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 px-6 py-3 text-left transition-colors",
                        row.isRead
                          ? "cursor-default"
                          : "cursor-pointer bg-blue-50/60 hover:bg-blue-50 dark:bg-blue-500/5 dark:hover:bg-blue-500/10",
                      )}
                    >
                      {/* The unread dot; a read row keeps its space so text lines up. */}
                      <span
                        aria-hidden
                        className={cn(
                          "mt-1.5 size-2 shrink-0 rounded-full",
                          row.isRead ? "bg-transparent" : "bg-[#155dfc]",
                        )}
                      />
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className={cn("text-sm", row.isRead && "text-muted-foreground")}>
                            {row.message}
                          </span>
                          {!row.isRead ? (
                            <Badge className="h-4.5 rounded-full bg-blue-100 px-2 text-[11px] font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
                              new
                            </Badge>
                          ) : null}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {whenLabel(row.createdAt)}
                          <span className="sr-only">{row.isRead ? ", read" : ", unread"}</span>
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}

          {/* The footer band: "Showing 1–10 of 20" and Previous / Page 1 of 2 /
              Next, as in the screenshot. */}
          {!isEmpty ? (
            <div className="flex min-h-12 items-center justify-between gap-3 border-t bg-muted/60 px-6 py-2">
              <span className="text-xs text-muted-foreground tabular-nums">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of{" "}
                {formatCount(totalCount)}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                  className="text-xs"
                >
                  Previous
                </Button>
                <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
                  Page {page} of {pageCount}
                </span>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= pageCount}
                  className="text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

/** One side of the All / Unread switch: a label and its count on a chip. */
function FilterTab({ value, label, count }) {
  return (
    <TabsTrigger
      value={value}
      className="group/filter h-7 flex-none gap-2 px-2.5 text-xs data-active:bg-primary data-active:text-primary-foreground data-active:shadow-none data-active:hover:text-primary-foreground dark:data-active:bg-primary dark:data-active:text-primary-foreground"
    >
      {label}
      <span className="min-w-6 rounded-full px-1.5 text-center text-[11px] tabular-nums group-data-active/filter:bg-background group-data-active/filter:text-foreground">
        {count != null ? formatCount(count) : "—"}
      </span>
    </TabsTrigger>
  );
}
