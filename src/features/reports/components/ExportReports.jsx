/**
 * The Reports page: pick a date range and a status, see what it covers, and
 * download it as Excel.
 *
 * Built on Adrian's screenshots/exportReports.png and exportReports2.png
 * (2026-09-15), his other app's export page: a Date Range card with preset
 * chips and locked start / end dates, a switch under it, a Report Summary of
 * StatTiles, an Export card, and a Preview table of what the file will hold.
 * Adapted to the data: the screenshot's report-type tabs are a **status**
 * filter here (there is one dataset, referrals), and there is **no PDF**
 * (Adrian: Excel only).
 *
 * Presentational and CONTROLLED -- `pages/ReportsPage.jsx` owns the range, the
 * status and the page, and runs the requests.
 *
 *   tenantName
 *   range / onRangeChange        A RANGE value.
 *   dates                        { dateFrom, dateTo } the range covers (null for All time).
 *   onCustomDateChange(field, value)
 *   rangeProblem                 Why a Custom range is unusable, or null.
 *   status / onStatusChange      A status value, or null for all.
 *   summary                      { referrals, approved, share, topName, topCount } -- any may be null.
 *   placeLabel                   "region" / "group", for the top-place tile.
 *   summaryLoading / summaryError
 *   rows / loading / error / page / totalPages / totalCount / pageSize / onPageChange
 *   onExport / isExporting / exportError
 */
import {
  CalendarDays,
  ChartPie,
  CircleCheck,
  FileSpreadsheet,
  FileText,
  Trophy,
} from "lucide-react";

import { DataPlaceholder } from "@/components/DataPlaceholder";
import { StatTile } from "@/components/StatTile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STATUSES } from "@/constants/status";
import { formatDate } from "@/lib/datetime";
import { cn } from "@/lib/utils";

import { formatCount } from "../dashboardFormat";
import { RANGE, RANGE_OPTIONS } from "../exportRange";

const ALL_STATUSES = "ALL";

/**
 * The status badge in the Preview, in the hues the Referrals tiles use.
 * `hover:` repeats the fill so a badge does not shift in a hovered row.
 */
const STATUS_BADGE = {
  Referred: "bg-blue-500/10 text-blue-700 hover:bg-blue-500/10 dark:text-blue-400",
  Presented: "bg-violet-500/10 text-violet-700 hover:bg-violet-500/10 dark:text-violet-400",
  "Closed Pending": "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400",
  Postponed: "bg-orange-500/10 text-orange-700 hover:bg-orange-500/10 dark:text-orange-400",
  Approved: "bg-green-500/10 text-green-700 hover:bg-green-500/10 dark:text-green-400",
  Declined: "bg-red-500/10 text-red-700 hover:bg-red-500/10 dark:text-red-400",
  Deferred: "bg-yellow-500/15 text-yellow-800 hover:bg-yellow-500/15 dark:text-yellow-400",
  Lost: "bg-slate-500/10 text-slate-700 hover:bg-slate-500/10 dark:text-slate-300",
};

export function ExportReports({
  tenantName,
  range,
  onRangeChange,
  dates,
  onCustomDateChange,
  rangeProblem = null,
  status,
  onStatusChange,
  summary = {},
  placeLabel,
  summaryLoading = false,
  summaryError = null,
  rows = [],
  loading = false,
  error = null,
  page,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onExport,
  isExporting = false,
  exportError = null,
}) {
  const isCustom = range === RANGE.CUSTOM;
  const statusLabel = status ? STATUSES.find((item) => item.value === status)?.label : null;
  const windowLabel =
    dates.dateFrom && dates.dateTo
      ? `created between ${formatDate(dates.dateFrom)} and ${formatDate(dates.dateTo)}`
      : "created at any time";
  const isEmpty = Boolean(rangeProblem) || loading || error || rows.length === 0;
  const pageCount = Math.max(1, totalPages);
  const tile = (value) => (summaryLoading ? <Skeleton className="h-8 w-12" /> : summaryError ? null : value);

  return (
    <div className="flex w-full flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold md:text-2xl">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Export {tenantName} referral data for any date range as Excel.
        </p>
      </div>

      {/* Date range: preset chips, and the dates they cover -- locked unless Custom. */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays aria-hidden className="size-4 text-muted-foreground" />
            Date range
          </CardTitle>
          <CardDescription>Select a period for the report. The summary, preview and export use this range.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div role="group" aria-label="Date range" className="flex flex-wrap gap-2">
            {RANGE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={range === option.value ? "default" : "outline"}
                size="sm"
                aria-pressed={range === option.value}
                onClick={() => onRangeChange(option.value)}
                className="text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium">Start date</span>
              <Input
                type="date"
                value={dates.dateFrom ?? ""}
                disabled={!isCustom}
                max={dates.dateTo ?? undefined}
                onChange={(event) => onCustomDateChange("dateFrom", event.target.value)}
                className="text-xs md:text-xs"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium">End date</span>
              <Input
                type="date"
                value={dates.dateTo ?? ""}
                disabled={!isCustom}
                min={dates.dateFrom ?? undefined}
                onChange={(event) => onCustomDateChange("dateTo", event.target.value)}
                className="text-xs md:text-xs"
              />
            </label>
          </div>

          <p className={cn("text-[10px]", rangeProblem ? "text-destructive" : "text-muted-foreground")}>
            {rangeProblem ??
              (isCustom ? (
                "Dates are Manila days, and the end date is included."
              ) : (
                <>
                  Date inputs are locked while a preset is selected. Click <span className="font-medium">Custom</span> to
                  edit them.
                </>
              ))}
          </p>
        </CardContent>
      </Card>

      {/* The status switch -- the screenshot's report-type tabs, as the one
          filter this data has. Scrolls sideways on a narrow screen. */}
      <div className="overflow-x-auto">
        <Tabs
          value={status ?? ALL_STATUSES}
          onValueChange={(value) => onStatusChange(value === ALL_STATUSES ? null : value)}
          className="w-fit"
        >
          <TabsList aria-label="Status" className="gap-1 border bg-card p-1 group-data-horizontal/tabs:h-auto">
            {[{ value: ALL_STATUSES, label: "All" }, ...STATUSES].map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className="h-7 flex-none px-2.5 text-xs data-active:bg-primary data-active:text-primary-foreground data-active:shadow-none data-active:hover:text-primary-foreground dark:data-active:bg-primary dark:data-active:text-primary-foreground"
              >
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report summary</CardTitle>
          <CardDescription>
            {statusLabel ? `${statusLabel} referrals` : "All referrals"} {windowLabel}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid auto-rows-fr grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile
              label={statusLabel ? `${statusLabel} referrals` : "Referrals"}
              value={tile(summary.referrals == null ? null : formatCount(summary.referrals))}
              icon={FileText}
              hint="in this range"
              accent="total"
            />
            <StatTile
              label="Share of all"
              value={tile(summary.share == null ? null : `${summary.share}%`)}
              icon={ChartPie}
              hint={statusLabel ? `of every referral in the range` : "every status included"}
              accent="share"
            />
            <StatTile
              label="Approved"
              value={tile(summary.approved == null ? null : formatCount(summary.approved))}
              icon={CircleCheck}
              hint="of every referral in the range"
              accent="done"
            />
            <StatTile
              label={`Top ${placeLabel}`}
              value={tile(summary.topName ?? null)}
              icon={Trophy}
              hint={summary.topName ? `${formatCount(summary.topCount)} referrals` : "no data"}
              accent="queue"
              className="[&>span:nth-child(2)]:truncate [&>span:nth-child(2)]:text-lg"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export</CardTitle>
          <CardDescription>
            {rangeProblem
              ? "Fix the date range to export."
              : loading
                ? "Counting referrals…"
                : totalCount > 0
                  ? `${formatCount(totalCount)} referral${totalCount === 1 ? "" : "s"} in this range will be exported.`
                  : "No referrals in this range to export."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-2">
          <Button
            onClick={onExport}
            disabled={Boolean(rangeProblem) || loading || totalCount === 0 || isExporting}
            className="text-xs"
          >
            <FileSpreadsheet data-icon="inline-start" />
            {isExporting ? "Exporting…" : "Export Excel"}
          </Button>
          {exportError ? (
            <p role="alert" className="text-xs text-destructive">
              {exportError.message}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className={cn("gap-0 overflow-hidden pb-0")}>
        <CardHeader className="pb-4">
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            {statusLabel ? `${statusLabel} referrals` : "Referrals"} {windowLabel} — the rows in the file
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0">
          {/* Desktop: the table. */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-t bg-muted/60 hover:bg-muted/60">
                  <TableHead className="h-9 pl-6 text-xs font-medium text-muted-foreground">Referral</TableHead>
                  <TableHead className="h-9 text-xs font-medium text-muted-foreground">Branch / group</TableHead>
                  <TableHead className="h-9 text-xs font-medium text-muted-foreground">Account Officer</TableHead>
                  <TableHead className="h-9 text-xs font-medium text-muted-foreground">Status</TableHead>
                  <TableHead className="h-9 pr-6 text-right text-xs font-medium text-muted-foreground">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isEmpty ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="py-10 text-center">
                      <PreviewEmpty rangeProblem={rangeProblem} loading={loading} error={error} />
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id} className="h-12">
                      <TableCell className="pl-6">
                        <div className="text-xs font-medium">{row.clientName ?? "—"}</div>
                        <div className="text-[10px] text-muted-foreground tabular-nums">{row.referralNo}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">{row.branchName ?? "—"}</div>
                        <div className="text-[10px] text-muted-foreground">{row.groupName ?? "—"}</div>
                      </TableCell>
                      <TableCell className="text-xs">{row.aoName ?? row.aoCode ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={STATUS_BADGE[row.status]}>
                          {row.status ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-right text-xs text-muted-foreground tabular-nums">
                        {formatDate(row.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Phone: a card per referral -- who, where, status, when. */}
          <div className="divide-y border-t md:hidden">
            {isEmpty ? (
              <div className="px-6 py-10 text-center">
                <PreviewEmpty rangeProblem={rangeProblem} loading={loading} error={error} />
              </div>
            ) : (
              rows.map((row) => (
                <div key={row.id} className="flex flex-col gap-1.5 px-6 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium">{row.clientName ?? "—"}</div>
                      <div className="text-[10px] text-muted-foreground tabular-nums">{row.referralNo}</div>
                    </div>
                    <Badge variant="secondary" className={cn("shrink-0", STATUS_BADGE[row.status])}>
                      {row.status ?? "—"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                    <span className="truncate">{row.branchName ?? row.groupName ?? "—"}</span>
                    <span className="shrink-0 tabular-nums">{formatDate(row.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer band, as the screenshot: Showing X–Y of Z, Previous / Page N of M / Next. */}
          <div className="flex min-h-12 items-center justify-between gap-3 border-t bg-muted/60 px-6 py-2">
            <span className="text-xs text-muted-foreground tabular-nums">
              {isEmpty
                ? "Showing 0–0 of 0"
                : `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalCount)} of ${formatCount(totalCount)}`}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                onClick={() => onPageChange(page - 1)}
                disabled={isEmpty || page <= 1}
                className="text-xs"
              >
                Previous
              </Button>
              <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
                Page {isEmpty ? 1 : page} of {isEmpty ? 1 : pageCount}
              </span>
              <Button
                variant="outline"
                size="xs"
                onClick={() => onPageChange(page + 1)}
                disabled={isEmpty || page >= pageCount}
                className="text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PreviewEmpty({ rangeProblem, loading, error }) {
  if (rangeProblem) return <span className="text-xs text-muted-foreground">{rangeProblem}</span>;
  return (
    <DataPlaceholder
      loading={loading}
      error={error}
      empty="No referrals in this date range."
      loadingLabel="Loading referrals..."
      className="text-xs"
    />
  );
}
