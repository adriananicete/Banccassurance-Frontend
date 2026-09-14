/**
 * The Reports page for a tenant head (Department Head, Sector Head): referrals
 * by status for every place one level down, drilling further on a row click.
 *
 * Built from shadcn components (Adrian, 2026-09-14): Card, Breadcrumb, Table,
 * Select and Button for the period and export (via DashboardParts), Badge.
 *
 * Presentational and CONTROLLED -- `pages/ReportsPage.jsx` owns the period and
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
import { ChevronRight } from "lucide-react";

import { DataPlaceholder } from "@/components/DataPlaceholder";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

/** The approved column, highlighted in the approved green (Adrian's colour). */
const APPROVED_INDEX = STATUSES.findIndex((status) => status.value === "Approved");

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
          title="Reports"
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
          {/* Desktop: the full table. Ten columns, so it scrolls sideways inside
              its own container on a narrow screen, never the page. */}
          <div className="-mx-6 hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-t bg-muted/60 hover:bg-muted/60">
                  <TableHead className="h-9 pl-6 text-xs font-medium text-muted-foreground">
                    {level.label}
                  </TableHead>
                  {STATUSES.map((status, index) => (
                    <TableHead
                      key={status.value}
                      className={cn(
                        "h-9 text-right text-xs font-medium text-muted-foreground",
                        index === APPROVED_INDEX && "text-[#00bb7c]",
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
                      className={cn(canDrill && "cursor-pointer")}
                    >
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          {row.name}
                          {canDrill ? (
                            <ChevronRight aria-hidden className="size-3.5 text-muted-foreground" />
                          ) : null}
                        </div>
                        <div className="text-[10px] text-muted-foreground tabular-nums">
                          {conversionRate(row.approved, row.total) ?? 0}% approved
                        </div>
                      </TableCell>
                      {row.counts.map((count, index) => (
                        <TableCell
                          key={STATUSES[index].value}
                          className={cn(
                            "text-right text-xs tabular-nums",
                            count === 0 && "text-muted-foreground",
                            index === APPROVED_INDEX && count > 0 && "font-medium text-[#00bb7c]",
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
                <TableFooter className="bg-muted/60">
                  <TableRow className="hover:bg-muted/60">
                    <TableCell className="py-4 pl-6 text-xs font-semibold">Total</TableCell>
                    {totals.counts.map((count, index) => (
                      <TableCell
                        key={STATUSES[index].value}
                        className={cn(
                          "py-4 text-right text-xs font-semibold tabular-nums",
                          index === APPROVED_INDEX && "text-[#00bb7c]",
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
          </div>

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
                      <div className="text-[10px] text-muted-foreground tabular-nums">
                        {conversionRate(row.approved, row.total) ?? 0}% approved
                      </div>
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
                      <div key={status.value} className="min-w-0">
                        <dt className="truncate text-[10px] text-muted-foreground">{status.label}</dt>
                        <dd
                          className={cn(
                            "text-xs tabular-nums",
                            index === APPROVED_INDEX && row.counts[index] > 0 && "font-medium text-[#00bb7c]",
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
