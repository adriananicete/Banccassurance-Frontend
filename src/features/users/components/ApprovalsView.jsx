/**
 * The Approvals screen: the registrations the signed-in approver decides on.
 *
 * Built on FRONTEND_DESIGN_PATTERN.md's List page (header, summary cards, a
 * filtered and paged table with two renderings, a confirm before every state
 * change) in Adrian's style (DECISIONS.md §0): shadcn base-nova, compact text,
 * picture before name, restrained colour. The Overview card's status tiles
 * (card2.png, right of an empty slot) are the status filter.
 *
 * Presentational and CONTROLLED -- `pages/ApprovalsPage.jsx` owns the status,
 * the search, the page and the dialog, because each changes a request.
 *
 *   approvesLabel     "Account Officers" -- who this role approves.
 *   status / onStatusChange   PENDING | APPROVED | REJECTED | ALL.
 *   counts            { PENDING, APPROVED, REJECTED, ALL } -> number | null.
 *   countsLoading / countsError
 *   search / onSearchChange   The raw box value; the page debounces it.
 *   rows              [{ userId, userCode, fullName, employeeNo, email,
 *                     mobileNumber, role, status, createdAt, photo }]
 *   loading / error   The table.
 *   page / totalPages / totalCount / pageSize / onPageChange
 *   canDeactivate     Superadmin only; hides the button for everyone else.
 *   onAction(row, action)   Opens the confirm dialog.
 *   pendingSlot       The left card beside the Overview (PendingApprovalsCard).
 */
import {
  CircleCheck,
  CircleX,
  RotateCcw,
  Search,
  ShieldAlert,
  UserCheck,
  UserMinus,
  UserRoundSearch,
  UserX,
  Users,
} from "lucide-react";

import { DataPlaceholder } from "@/components/DataPlaceholder";
import { StatTile } from "@/components/StatTile";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROLE_LABELS } from "@/constants/roles";
import { avatarUrl } from "@/lib/apiClient";
import { formatDate } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import { formatCount, pageItems } from "@/features/reports/dashboardFormat";

import {
  APPROVAL_ACTION,
  APPROVAL_STATUS,
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_STYLES,
} from "../approvalsUtils";

/**
 * The four tiles, in the order an approver works: what waits, what was
 * decided, what was switched off. Accents are StatTile's meanings -- queue
 * amber, done green, stopped red, ended slate. "All" is the button in the
 * card's header, so the 2 x 2 stays whole with the fifth status (F13).
 */
const STATUS_TILES = [
  { status: APPROVAL_STATUS.PENDING, icon: UserRoundSearch, accent: "queue", hint: "waiting for your decision" },
  { status: APPROVAL_STATUS.APPROVED, icon: UserCheck, accent: "done", hint: "can sign in" },
  { status: APPROVAL_STATUS.REJECTED, icon: UserX, accent: "stopped", hint: "refused at registration" },
  { status: APPROVAL_STATUS.DEACTIVATED, icon: UserMinus, accent: "ended", hint: "approved, then switched off" },
];

export function ApprovalsView({
  approvesLabel,
  status,
  onStatusChange,
  counts,
  countsLoading = false,
  countsError = null,
  search,
  onSearchChange,
  rows = [],
  loading = false,
  error = null,
  page,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  canDeactivate = false,
  onAction,
  pendingSlot = null,
}) {
  const isEmpty = loading || error || rows.length === 0;
  const searching = search.trim().length > 0;
  const statusLabel = APPROVAL_STATUS_LABELS[status];

  const empty = searching
    ? `No registrations match “${search.trim()}”.`
    : status === APPROVAL_STATUS.PENDING
      ? `No ${approvesLabel} waiting for your decision.`
      : status === APPROVAL_STATUS.ALL
        ? `No ${approvesLabel} have registered under you yet.`
        : `No ${statusLabel.toLowerCase()} registrations.`;

  const emptyState = (
    <DataPlaceholder
      loading={loading}
      error={error}
      empty={empty}
      loadingLabel="Loading registrations..."
    />
  );

  return (
    <div className="flex w-full flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold md:text-2xl">Approvals</h1>
        <p className="text-sm text-muted-foreground">
          Approve or reject the {approvesLabel} who registered under you
        </p>
      </div>

      {/* Two columns from lg (Adrian, 2026-09-15): the pending queue on the left
          and the Overview on the right, half and half (Adrian). One column below lg, same order. */}
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2">
        {/* Left: the pending queue (PendingApprovalsCard), handed in by the page. */}
        {pendingSlot}

        {/* The Overview, on Adrian's screenshots/card2.png: title and
            description, a 2 x 2 of StatTiles, and a grey footer band. The tiles
            ARE the status filter; the picked one takes a border in its hue. The
            band sits flush with the bottom edge, so no bottom padding. */}
        <Card className="gap-4 overflow-hidden pb-0">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Registration status for the {approvesLabel} under you</CardDescription>
            {/* Every status at once -- the filter the tiles narrow. */}
            <CardAction>
              <Button
                variant="outline"
                size="xs"
                aria-pressed={status === APPROVAL_STATUS.ALL}
                onClick={() => onStatusChange(APPROVAL_STATUS.ALL)}
                className={cn(
                  "text-xs tabular-nums",
                  status === APPROVAL_STATUS.ALL && "border-blue-400/70 bg-blue-50 dark:border-blue-400/50 dark:bg-blue-500/10",
                )}
              >
                <Users data-icon="inline-start" />
                All
                <span className="text-muted-foreground">
                  {countsLoading || counts?.ALL == null ? "—" : formatCount(counts.ALL)}
                </span>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div role="group" aria-label="Filter by status" className="grid auto-rows-fr grid-cols-2 gap-3">
              {STATUS_TILES.map((tile) => {
                const count = counts?.[tile.status];

                return (
                  <StatTile
                    key={tile.status}
                    label={APPROVAL_STATUS_LABELS[tile.status]}
                    value={
                      countsLoading ? (
                        <Skeleton className="h-8 w-10" />
                      ) : countsError || count == null ? null : (
                        formatCount(count)
                      )
                    }
                    icon={tile.icon}
                    hint={tile.hint}
                    accent={tile.accent}
                    onClick={() => onStatusChange(tile.status)}
                    pressed={status === tile.status}
                  />
                );
              })}
            </div>
          </CardContent>
          {/* The footer band (card2.png): one bold line with an icon and one
              muted sentence -- the consequence worth knowing before acting
              (BACKEND.md §6). */}
          <CardFooter className="flex-col items-start gap-0.5 border-t bg-muted/50 py-3 [.border-t]:pt-3">
            <span className="flex items-center gap-1.5 text-xs font-medium">
              Rejecting is final
              <ShieldAlert aria-hidden className="size-3.5 text-muted-foreground" />
            </span>
            <span className="text-[10px] text-muted-foreground">
              A rejected registration cannot be reactivated, and its email cannot register again
            </span>
          </CardFooter>
        </Card>
      </div>
      <Card className={cn(!isEmpty && "overflow-hidden pb-0")}>
        {/* Title left, search right, level from sm (Adrian's card header). */}
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              Registrations
              <Badge variant="secondary" className="tabular-nums">
                {formatCount(totalCount)}
              </Badge>
            </CardTitle>
            <CardDescription>
              {approvesLabel} · {statusLabel.toLowerCase()}
              {searching ? ` · matching “${search.trim()}”` : ""}
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search name or employee no."
              aria-label="Search registrations"
              className="pl-8 text-xs md:text-xs"
            />
          </div>
        </CardHeader>

        <CardContent>
          {/* Desktop: the table. */}
          <div className="-mx-6 hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-t bg-muted/60 hover:bg-muted/60">
                  <TableHead className="h-9 pl-6 text-xs font-medium text-muted-foreground">Name</TableHead>
                  <TableHead className="h-9 text-xs font-medium text-muted-foreground">Employee no.</TableHead>
                  <TableHead className="h-9 text-xs font-medium text-muted-foreground">Role</TableHead>
                  <TableHead className="h-9 text-xs font-medium text-muted-foreground">Contact</TableHead>
                  <TableHead className="h-9 text-xs font-medium text-muted-foreground">Registered</TableHead>
                  <TableHead className="h-9 text-xs font-medium text-muted-foreground">Status</TableHead>
                  <TableHead className="h-9 pr-6 text-right text-xs font-medium text-muted-foreground">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isEmpty ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="py-6 text-center">
                      {emptyState}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.userId} className="h-12">
                      <TableCell className="pl-6">
                        <PersonChip row={row} />
                      </TableCell>
                      <TableCell className="text-xs tabular-nums text-muted-foreground">
                        {row.employeeNo ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs">{ROLE_LABELS[row.role] ?? row.role ?? "—"}</TableCell>
                      <TableCell>
                        <div className="text-xs">{row.email ?? "—"}</div>
                        {row.mobileNumber ? (
                          <div className="text-[10px] text-muted-foreground tabular-nums">
                            {row.mobileNumber}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">
                        {formatDate(row.createdAt)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <RowActions row={row} canDeactivate={canDeactivate} onAction={onAction} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Phone: one card per registration -- who, role, when, status -- and
              the actions under it. No sideways scrolling. */}
          <div className={cn("-mx-6 divide-y border-t md:hidden", isEmpty && "border-b")}>
            {isEmpty ? (
              <div className="px-6 py-6 text-center">{emptyState}</div>
            ) : (
              rows.map((row) => (
                <div key={row.userId} className="flex flex-col gap-2 px-6 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <PersonChip row={row} />
                    <StatusBadge status={row.status} />
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                    <span className="truncate">{ROLE_LABELS[row.role] ?? row.role ?? "—"}</span>
                    <span className="shrink-0 tabular-nums">{formatDate(row.createdAt)}</span>
                  </div>
                  <RowActions
                    row={row}
                    canDeactivate={canDeactivate}
                    onAction={onAction}
                    className="justify-end"
                  />
                </div>
              ))
            )}
          </div>

          {/* The footer band -- light grey like the column titles: "Showing
              1–10 of 42" and shadcn's Pagination. The API pages, so each page
              is a request. */}
          {!isEmpty ? (
            <div className="-mx-6 flex min-h-12 items-center justify-between gap-3 border-t bg-muted/60 px-6 py-2">
              <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of{" "}
                {formatCount(totalCount)}
              </span>
              <Pager page={page} totalPages={Math.max(1, totalPages)} onPageChange={onPageChange} />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

/** Picture, name, user code under it -- names text-xs, the code 10px muted (Adrian). */
function PersonChip({ row }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <UserAvatar src={avatarUrl(row.photo)} name={row.fullName} size="sm" />
      <div className="min-w-0">
        <div className="truncate text-xs font-medium">{row.fullName ?? "—"}</div>
        {row.userCode ? (
          <div className="truncate text-[10px] text-muted-foreground">{row.userCode}</div>
        ) : null}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <Badge variant="secondary" className={cn("shrink-0", APPROVAL_STATUS_STYLES[status])}>
      {APPROVAL_STATUS_LABELS[status] ?? status ?? "—"}
    </Badge>
  );
}

/**
 * What can be done to a row. A pending registration is approved or rejected.
 * Deactivate and reactivate are superadmin only (`canDeactivate`): an approved
 * account can be deactivated, a DEACTIVATED one reactivated (F13). Every other
 * approver sees their people's DEACTIVATED rows but cannot act on them, so the
 * row says who can (F15). A REJECTED registration never comes back -- no action.
 */
function RowActions({ row, canDeactivate, onAction, className }) {
  if (row.status === APPROVAL_STATUS.PENDING) {
    return (
      <div className={cn("flex items-center gap-2 md:justify-end", className)}>
        <Button
          variant="outline"
          size="xs"
          onClick={() => onAction(row, APPROVAL_ACTION.REJECT)}
          className="text-xs"
        >
          <CircleX data-icon="inline-start" />
          Reject
        </Button>
        <Button size="xs" onClick={() => onAction(row, APPROVAL_ACTION.APPROVE)} className="text-xs">
          <CircleCheck data-icon="inline-start" />
          Approve
        </Button>
      </div>
    );
  }

  if (row.status === APPROVAL_STATUS.APPROVED && canDeactivate) {
    return (
      <div className={cn("flex items-center md:justify-end", className)}>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onAction(row, APPROVAL_ACTION.DEACTIVATE)}
          className="text-xs text-destructive"
        >
          Deactivate
        </Button>
      </div>
    );
  }

  if (row.status === APPROVAL_STATUS.DEACTIVATED) {
    return canDeactivate ? (
      <div className={cn("flex items-center md:justify-end", className)}>
        <Button
          variant="outline"
          size="xs"
          onClick={() => onAction(row, APPROVAL_ACTION.REACTIVATE)}
          className="text-xs"
        >
          <RotateCcw data-icon="inline-start" />
          Reactivate
        </Button>
      </div>
    ) : (
      <p className={cn("text-[10px] text-muted-foreground md:text-right", className)}>
        Only a superadmin can reactivate this account.
      </p>
    );
  }

  return null;
}

/** shadcn's Pagination: previous, page numbers with ellipses, next. */
function Pager({ page, totalPages, onPageChange }) {
  // The page links are anchors (href="#"), so each click stays on the page.
  const goTo = (target) => (event) => {
    event.preventDefault();
    onPageChange(Math.min(Math.max(1, target), totalPages));
  };

  return (
    <Pagination className="mx-0 w-full justify-center sm:w-auto sm:justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={goTo(page - 1)}
            aria-disabled={page <= 1}
            className={cn("text-xs", page <= 1 && "pointer-events-none opacity-50")}
          />
        </PaginationItem>
        {pageItems(page, totalPages).map((item, index) =>
          item === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationLink
                href="#"
                onClick={goTo(item)}
                isActive={item === page}
                className="text-xs tabular-nums"
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={goTo(page + 1)}
            aria-disabled={page >= totalPages}
            className={cn("text-xs", page >= totalPages && "pointer-events-none opacity-50")}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
