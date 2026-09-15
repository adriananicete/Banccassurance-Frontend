/**
 * The Reports page for a tenant head (Department Head, Sector Head): referrals
 * by status for every place one level down, drilling further on a row click.
 *
 * Built from shadcn components (Adrian, 2026-09-14): Card (the status overview
 * of StatTiles, then the table card), Breadcrumb, Table, Select and Button for the
 * period and export (via DashboardParts), Badge.
 *
 * Presentational and CONTROLLED -- `features/referrals/pages/ReferralsPage.jsx` owns the period and
 * the drill path, because both change the request.
 *
 * The props contract:
 *
 *   tenantName   "PhilLife" / "Landbank".
 *   level        { label, plural } for the rows shown.
 *   path         [{ code, name }] -- the places drilled into, outermost first.
 *   canDrill     Whether a row click goes a level further.
 *   rows         [{ code, name, counts: [8], total, approved }] from reportData.js.
 *   preset / onPresetChange
 *   onDrill(row) / onCrumb(index)   index -1 is the tenant itself.
 *   loading / error
 *   onExport / isExporting / exportError
 */
import {
  Ban,
  CalendarClock,
  ChevronRight,
  CircleCheck,
  CirclePause,
  CircleX,
  Hourglass,
  Presentation,
  Send,
} from "lucide-react";
import { useState } from "react";

import { DataPlaceholder } from "@/components/DataPlaceholder";
import { StatTile } from "@/components/StatTile";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STATUSES } from "@/constants/status";
import { cn } from "@/lib/utils";

import { conversionRate, formatCount, presetLabel } from "../dashboardFormat";
import { reportTotals } from "../reportData";
import { DashboardTitle, ExportControl } from "./DashboardParts";

/**
 * Each status's tile accent (StatTile) -- Adrian's screenshots/card.png on the
 * Reports page, 2026-09-15. The hues are the ones the status cards already had:
 * Referred blue (the referrals colour), Presented violet, Closed Pending amber,
 * Postponed orange, Approved green, Declined red, Deferred yellow, Lost slate.
 */
const STATUS_ACCENT = {
  Referred: "total",
  Presented: "progress",
  "Closed Pending": "queue",
  Postponed: "delayed",
  Approved: "done",
  Declined: "stopped",
  Deferred: "held",
  Lost: "ended",
};

/**
 * The wash over a picked status's column in the table -- title, every count and
 * the total -- in its tile's hue (Adrian, 2026-09-15). Full class strings so
 * Tailwind generates them.
 */
const STATUS_COLUMN = {
  Referred: "bg-blue-500/8",
  Presented: "bg-violet-500/8",
  "Closed Pending": "bg-amber-500/8",
  Postponed: "bg-orange-500/8",
  Approved: "bg-green-500/8",
  Declined: "bg-red-500/8",
  Deferred: "bg-yellow-500/10",
  Lost: "bg-slate-500/8",
};

/** An icon per status, top right on its tile. */
const STATUS_ICONS = {
  Referred: Send,
  Presented: Presentation,
  "Closed Pending": Hourglass,
  Postponed: CalendarClock,
  Approved: CircleCheck,
  Declined: CircleX,
  Deferred: CirclePause,
  Lost: Ban,
};

export function StatusReport({
  tenantName,
  level,
  path = [],
  canDrill,
  rows = [],
  preset,
  onPresetChange,
  onDrill,
  onCrumb,
  loading = false,
  error = null,
  onExport,
  isExporting = false,
  exportError = null,
}) {
  // A status card pressed; its column is highlighted. Pressing it again clears it.
  const [picked, setPicked] = useState(null);
  const columnWash = (index) =>
    picked === STATUSES[index].value ? STATUS_COLUMN[picked] : null;

  const period = presetLabel(preset);
  const totals = reportTotals(rows);
  const placeName = path.length ? path.at(-1).name : `All of ${tenantName}`;
  const isEmpty = loading || error || rows.length === 0;

  const emptyState = (
    <DataPlaceholder
      loading={loading}
      error={error}
      empty={`No ${level.plural.toLowerCase()} with referrals in this period.`}
      loadingLabel={`Loading ${level.plural.toLowerCase()}...`}
    />
  );

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <DashboardTitle
          title="Referrals"
          subtitle={`${tenantName} referrals by status, place by place`}
        />
        <ExportControl
          preset={preset}
          onPresetChange={onPresetChange}
          onExport={onExport}
          isExporting={isExporting}
          exportError={exportError}
          scopeName={tenantName}
        />
      </div>

      <StatusCards
        totals={totals}
        placeName={placeName}
        period={period}
        loading={loading}
        error={error}
        picked={picked}
        onPick={(value) => setPicked(picked === value ? null : value)}
      />

      <Card className={cn(!isEmpty && "overflow-hidden pb-0")}>
        <CardHeader className="gap-3">
          {/* Where the table is: the tenant, then each place drilled into. Every
              crumb but the last goes back up. */}
          <Breadcrumb>
            <BreadcrumbList className="text-xs">
              <BreadcrumbItem>
                {path.length ? (
                  <BreadcrumbLink
                    render={<button type="button" className="cursor-pointer" />}
                    onClick={() => onCrumb(-1)}
                  >
                    All of {tenantName}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>All of {tenantName}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {path.map((place, index) => (
                <FragmentCrumb
                  key={`${place.code}-${index}`}
                  place={place}
                  isLast={index === path.length - 1}
                  onClick={() => onCrumb(index)}
                />
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              {level.plural}
              <Badge variant="secondary" className="tabular-nums">
                {rows.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              {placeName} · by status · {period}
              {canDrill ? ` · pick a ${level.label.toLowerCase()} to see what is under it` : ""}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {/* Desktop: the full table in shadcn's ScrollArea (Adrian, 2026-09-15):
              ten rows show, the rest scroll, with the column titles and the totals
              held in place. Rows are a fixed h-12 so exactly ten fit. The table's
              own container stops clipping (overflow-visible) so the ScrollArea
              viewport is what scrolls -- sticky needs that -- and a narrow screen
              scrolls sideways with the horizontal ScrollBar, never the page. */}
          <ScrollArea className="-mx-6 hidden md:block [&_[data-slot=scroll-area-viewport]]:max-h-[36rem] [&_[data-slot=table-container]]:overflow-visible">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow className="border-t bg-muted/60 hover:bg-muted/60">
                  <TableHead className="h-9 pl-6 text-xs font-medium text-muted-foreground">
                    {level.label}
                  </TableHead>
                  {STATUSES.map((status, index) => (
                    <TableHead
                      key={status.value}
                      className={cn(
                        "h-9 text-right text-xs font-medium text-muted-foreground",
                        columnWash(index),
                      )}
                    >
                      {status.label}
                    </TableHead>
                  ))}
                  <TableHead className="h-9 pr-6 text-right text-xs font-medium text-muted-foreground">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isEmpty ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={STATUSES.length + 2} className="py-6 text-center">
                      {emptyState}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow
                      key={row.code}
                      onClick={canDrill ? () => onDrill(row) : undefined}
                      className={cn("h-12", canDrill && "cursor-pointer")}
                    >
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          {row.name}
                          {canDrill ? (
                            <ChevronRight aria-hidden className="size-3.5 text-muted-foreground" />
                          ) : null}
                        </div>
                        <ApprovedShare row={row} />
                      </TableCell>
                      {row.counts.map((count, index) => (
                        <TableCell
                          key={STATUSES[index].value}
                          className={cn(
                            "text-right text-xs tabular-nums",
                            count === 0 && "text-muted-foreground",
                            columnWash(index),
                          )}
                        >
                          {formatCount(count)}
                        </TableCell>
                      ))}
                      <TableCell className="pr-6 text-right text-xs font-semibold tabular-nums text-[#155dfc] dark:text-blue-400">
                        {formatCount(row.total)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {!isEmpty ? (
                // Column totals on the same grey band as the titles, with more
                // room top and bottom than a body row (Adrian).
                <TableFooter className="sticky bottom-0 bg-card [&>tr]:bg-muted/60">
                  <TableRow className="hover:bg-muted/60">
                    <TableCell className="py-4 pl-6 text-xs font-semibold">Total</TableCell>
                    {totals.counts.map((count, index) => (
                      <TableCell
                        key={STATUSES[index].value}
                        className={cn(
                          "py-4 text-right text-xs font-semibold tabular-nums",
                          columnWash(index),
                        )}
                      >
                        {formatCount(count)}
                      </TableCell>
                    ))}
                    <TableCell className="py-4 pr-6 text-right text-xs font-semibold tabular-nums text-[#155dfc] dark:text-blue-400">
                      {formatCount(totals.total)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              ) : null}
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Phone: one card per place -- the total, then the eight statuses in
              a compact grid. No sideways scrolling. */}
          <div className="-mx-6 divide-y border-t md:hidden">
            {isEmpty ? (
              <div className="px-6 py-6 text-center">{emptyState}</div>
            ) : (
              rows.map((row) => (
                <button
                  key={row.code}
                  type="button"
                  disabled={!canDrill}
                  onClick={() => onDrill(row)}
                  className="w-full space-y-2 px-6 py-3 text-left disabled:cursor-default"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 truncate text-xs font-medium">
                        {row.name}
                        {canDrill ? <ChevronRight aria-hidden className="size-3.5 text-muted-foreground" /> : null}
                      </div>
                      <ApprovedShare row={row} />
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold tabular-nums text-[#155dfc] dark:text-blue-400">
                        {formatCount(row.total)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">referrals</div>
                    </div>
                  </div>
                  <dl className="grid grid-cols-4 gap-x-2 gap-y-1">
                    {STATUSES.map((status, index) => (
                      <div
                        key={status.value}
                        className={cn("-mx-1 min-w-0 rounded-sm px-1", columnWash(index))}
                      >
                        <dt className="truncate text-[10px] text-muted-foreground">{status.label}</dt>
                        <dd
                          className={cn(
                            "text-xs tabular-nums",
                            row.counts[index] === 0 && "text-muted-foreground",
                          )}
                        >
                          {formatCount(row.counts[index])}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * The status overview, above the table (Adrian): one card of StatTiles, the
 * totals of the rows below -- the same figures as the table's footer row -- for
 * the place and period shown.
 *
 * Built on Adrian's own design, screenshots/card.png (2026-09-15): a card with a
 * title and a description naming the place and period, then a tile per status
 * -- faint tint and border in its hue, label and outline icon on top, the
 * count, a muted caption. Pressing a tile highlights its column in the table;
 * the pressed tile takes a border in its hue. Two across on a phone, four from
 * md, so the eight sit in two rows.
 */
function StatusCards({ totals, placeName, period, loading, error, picked, onPick }) {
  const pending = loading || error;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status overview</CardTitle>
        <CardDescription>
          {placeName} · {period} · pick a status to find its column below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid auto-rows-fr grid-cols-2 gap-3 md:grid-cols-4">
          {STATUSES.map((status, index) => {
            const count = totals.counts[index];
            const share = totals.total > 0 ? Math.round((count / totals.total) * 100) : 0;

            return (
              <StatTile
                key={status.value}
                label={status.label}
                value={loading ? <Skeleton className="h-8 w-10" /> : error ? null : formatCount(count)}
                icon={STATUS_ICONS[status.value]}
                hint={pending ? "—" : `${share}% of ${formatCount(totals.total)} referrals`}
                accent={STATUS_ACCENT[status.value]}
                // The fade from the bottom, 5% and 15% on hover (Adrian).
                fade
                onClick={() => onPick(status.value)}
                pressed={picked === status.value}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
/**
 * "% approved" under a place's name, in the approved green -- only when the
 * place has an approved referral (Adrian, 2026-09-15: no "0% approved"). A
 * share that rounds to 0 reads "<1% approved" rather than disappearing.
 */
function ApprovedShare({ row }) {
  if (!row.approved) return null;
  const rate = conversionRate(row.approved, row.total);

  return (
    <div className="text-[10px] font-medium text-[#00bb7c] tabular-nums">
      {rate > 0 ? `${rate}%` : "<1%"} approved
    </div>
  );
}

/** A separator and one drilled-into place: a link back up, or the current page. */
function FragmentCrumb({ place, isLast, onClick }) {
  return (
    <>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        {isLast ? (
          <BreadcrumbPage>{place.name}</BreadcrumbPage>
        ) : (
          <BreadcrumbLink render={<button type="button" className="cursor-pointer" />} onClick={onClick}>
            {place.name}
          </BreadcrumbLink>
        )}
      </BreadcrumbItem>
    </>
  );
}
