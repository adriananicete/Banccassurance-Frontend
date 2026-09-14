/**
 * The pieces both tenant dashboards are built from -- the Department Head's
 * (PhilLife: regions -> groups) and the Sector Head's (Landbank: groups ->
 * branches). Same look, different labels; every label that names a tenant, a
 * tier or a role is a prop.
 *
 * Design rules these carry are in context/DECISIONS.md §0 and §2: green
 * #00bb7c for approved, blue #155dfc for referrals, compact text, picture
 * before name, restrained colour.
 */
import { ChartPie, ChevronLeft, CircleCheck, Download, FileText, Percent } from "lucide-react";
import { useState } from "react";
import { TbChartAreaLine } from "react-icons/tb";

import { DataPlaceholder } from "@/components/DataPlaceholder";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/StatTile";
import { UserAvatar } from "@/components/UserAvatar";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { ALL_REGIONS as ALL } from "../dashboardData";
import {
  PERIOD_OPTIONS,
  PLACE_HOVERS,
  conversionRate,
  formatCount,
  pageItems,
  shareOf,
} from "../dashboardFormat";

/**
 * The page title and its one sentence.
 */
export function DashboardTitle({ title = "Dashboard", subtitle }) {
  return (
    <div>
      <h1 className="text-xl font-semibold md:text-2xl">{title}</h1>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

/**
 * The period dropdown -- shadcn's Select. `items` gives the trigger the
 * option's label rather than its raw value.
 */
export function PeriodSelect({ preset, onPresetChange, className }) {
  return (
    <Select
      items={PERIOD_OPTIONS}
      value={preset}
      onValueChange={(value) => {
        if (value) onPresetChange(value);
      }}
    >
      <SelectTrigger aria-label="Period" className={cn("w-full text-xs sm:w-40", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERIOD_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-xs">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * The period, and the download -- shadcn's Select and Button.
 *
 * The period drives the whole screen. The EXPORT does not follow the region --
 * it is always the caller's whole scope (backend Q2) -- so the button names
 * that scope ("Export all of PhilLife"), rather than looking like it downloads
 * what the tabs show.
 */
export function ExportControl({ preset, onPresetChange, onExport, isExporting, exportError, scopeName }) {
  return (
    <div className="flex flex-col gap-1 sm:items-end">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <PeriodSelect preset={preset} onPresetChange={onPresetChange} />
        <Button onClick={() => onExport?.(preset)} disabled={isExporting} className="text-xs">
          <Download data-icon="inline-start" />
          {isExporting ? "Exporting…" : `Export all of ${scopeName}`}
        </Button>
      </div>

      {exportError ? (
        <p role="alert" className="text-xs text-destructive">
          {exportError.message}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The region buttons -- shadcn's Tabs, used as a control rather than to switch
 * panels: All regions, then every region. Built from `regions`, so a region
 * added in the data needs nothing added here.
 */
export function RegionScope({ regions, selected, onSelect }) {
  const options = [{ code: ALL, name: "All regions" }, ...regions];

  return (
    <Tabs value={selected} onValueChange={onSelect} className="w-full sm:w-fit">
      <TabsList aria-label="Region" className="w-full sm:w-fit">
        {options.map((option) => (
          <TabsTrigger key={option.code} value={option.code} className="px-3 text-xs">
            {option.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
/**
 * One place's figures, in the slot beside the chart once a place is picked.
 *
 *   scope          { name, total, approved, headName, headUserCode, headAvatarSrc }
 *   share          The place's percentage of the tenant, same period.
 *   tenantName     "PhilLife" / "Landbank", for the Share tile.
 *   headRoleLabel  "Regional Sales Head" / "Group Head", under the head's name.
 *   onBack / backLabel   Optional. A "← Groups" link above the title, back to
 *                  the list this Overview replaced (Adrian).
 */
export function OverviewCard({
  scope,
  share,
  period,
  loading,
  error,
  tenantName,
  headRoleLabel,
  onBack,
  backLabel,
}) {
  const rate = conversionRate(scope.approved, scope.total);

  return (
    <Card className="h-full">
      <CardHeader>
        {onBack ? (
          <Button
            variant="ghost"
            size="xs"
            onClick={onBack}
            className="-ml-2 w-fit text-muted-foreground"
          >
            <ChevronLeft data-icon="inline-start" />
            {backLabel}
          </Button>
        ) : null}
        <CardTitle>Overview</CardTitle>
        <CardDescription>
          {scope.name} · {period}
        </CardDescription>
        {/* Who runs this place, beside what it did. A place without a head says
            so rather than leaving the corner empty. */}
        <CardAction className="flex min-w-0 items-center gap-2">
          <UserAvatar src={scope.headAvatarSrc} name={scope.headName} size="md" />
          <div className="min-w-0">
            <div className="truncate text-xs font-medium">{scope.headName ?? "No one assigned"}</div>
            <div className="truncate text-xs text-muted-foreground">{headRoleLabel}</div>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-auto">
        {loading || error ? (
          <DataPlaceholder loading={loading} error={error} loadingLabel="Loading figures..." />
        ) : (
          <div className="grid auto-rows-fr grid-cols-2 gap-3">
            <StatTile
              label={`Referrals · ${period}`}
              value={formatCount(scope.total)}
              icon={FileText}
              accent="total"
            />
            <StatTile
              label={`Approved · ${period}`}
              value={formatCount(scope.approved)}
              icon={CircleCheck}
              accent="done"
              hint={scope.total != null ? `Of ${formatCount(scope.total)} referrals` : null}
            />
            <StatTile
              label={`Conversion · ${period}`}
              value={rate != null ? `${rate}%` : null}
              icon={Percent}
              hint="Approved out of referred"
            />
            <StatTile
              label={`Share of ${tenantName} · ${period}`}
              value={share != null ? `${share}%` : null}
              icon={ChartPie}
              hint={`Of all ${tenantName} referrals`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * A ranked list of places -- regions for the Department Head, groups for the
 * Sector Head -- ranked by conversion, NOT by volume, so the weakest closer is
 * not buried at the bottom. Each row is the way into that place.
 *
 *   items        [{ code, name, total, approved, headName, headUserCode, headAvatarSrc }]
 *   total        The tenant's referrals over the period, for "% of <tenant>".
 *   toggle       When true, pressing the picked row again un-picks it (regions).
 *   noHeadLabel  "No Regional Sales Head assigned" / "No Group Head assigned".
 */
export function PlacesCard({
  title,
  items,
  total,
  period,
  selected,
  onSelect,
  toggle = false,
  loading,
  error,
  tenantName,
  noHeadLabel,
  emptyText,
}) {
  // Tint follows the item's place in `items`; order follows conversion.
  const ranked = items
    .map((item, index) => ({ ...item, hover: PLACE_HOVERS[index % PLACE_HOVERS.length] }))
    .sort(
      (a, b) =>
        (conversionRate(b.approved, b.total) ?? 0) - (conversionRate(a.approved, a.total) ?? 0),
    );

  return (
    // The card itself carries the design: a faint blue wash and a blue-tinted
    // border, keyed to the title icon; the rows stay plain. Tighter padding
    // than the Card default, per Adrian.
    <Card className="h-full gap-3 py-4 border-blue-100 bg-linear-to-b from-blue-50/80 via-card to-card dark:border-blue-500/20 dark:from-blue-500/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
          >
            <TbChartAreaLine className="size-4" />
          </span>
          {title}
        </CardTitle>
        <CardDescription>Ranked by conversion · {period}</CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-auto">
        {loading || error || items.length === 0 ? (
          // Every place is listed, at 0 when it has no referrals (Adrian,
          // 2026-09-14). The message is only for loading, an error, or no places.
          <DataPlaceholder
            loading={loading}
            error={error}
            empty={emptyText}
            loadingLabel={`Loading ${title.toLowerCase()}...`}
          />
        ) : (
          <ul className="-mx-6 divide-y border-y">
            {ranked.map((item) => {
              const rate = conversionRate(item.approved, item.total);
              const isSelected = selected === item.code;

              return (
                <li key={item.code}>
                  <button
                    type="button"
                    onClick={() => onSelect(toggle && isSelected ? ALL : item.code)}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex w-full cursor-pointer flex-col gap-2 px-6 py-3 text-left transition-colors",
                      isSelected ? "bg-muted" : item.hover,
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium">{item.name}</div>
                        <div className="mt-1 flex min-w-0 items-center gap-1.5">
                          <UserAvatar src={item.headAvatarSrc} name={item.headName} size="sm" />
                          <span className="truncate text-xs text-muted-foreground">
                            {item.headName ? `${item.headName} · ${item.headUserCode}` : noHeadLabel}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        {/* Blue for referrals; lighter in dark mode. */}
                        <div className="font-medium tabular-nums text-[#155dfc] dark:text-blue-400">
                          {formatCount(item.total)}
                        </div>
                        <div className="text-xs text-muted-foreground">referrals</div>
                      </div>
                    </div>

                    {/* Green for approved; 0 rather than null so an empty place
                        never draws as indeterminate. */}
                    <Progress
                      value={rate ?? 0}
                      aria-label={`${item.name} approved`}
                      className="w-full [&_[data-slot=progress-indicator]]:bg-[#00bb7c]"
                    />

                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="tabular-nums">
                        {rate != null ? `${rate}% approved` : "No referrals in this period"}
                      </span>
                      <span className="tabular-nums">
                        {shareOf(item.total, total)}% of {tenantName}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * A table of the places one tier down -- groups (Department Head) or branches
 * (Sector Head): the place, its head, the approved share, and the referrals.
 *
 * Ranked by approval; a place with no referrals sinks to the bottom. One
 * component, two renderings (pattern §6): a table from md, a card list below.
 *
 *   rows         [{ code, name, parentName, total, approved, headName, headUserCode, headAvatarSrc }]
 *   showParent   Show `parentName` under the place's name (region or group).
 *   tabs         The region buttons, placed opposite the title.
 *   pageSize     Optional. Pages the rows with shadcn's Pagination. The parent
 *                should key this component on the scope so a new scope starts
 *                on page 1.
 */
export function PlacesTable({
  title,
  description,
  rows,
  loading,
  error,
  placeLabel,
  headLabel,
  noHeadLabel,
  showParent,
  tabs,
  emptyText,
  pageSize,
}) {
  const [page, setPage] = useState(1);

  const ranked = rows
    .map((row) => ({ ...row, rate: conversionRate(row.approved, row.total) }))
    .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1));

  const pageCount = pageSize ? Math.max(1, Math.ceil(ranked.length / pageSize)) : 1;
  const currentPage = Math.min(page, pageCount);
  const firstIndex = pageSize ? (currentPage - 1) * pageSize : 0;
  const shown = pageSize ? ranked.slice(firstIndex, firstIndex + pageSize) : ranked;

  // The page links are anchors (href="#"), so each click stays on the page.
  const goTo = (target) => (event) => {
    event.preventDefault();
    setPage(Math.min(Math.max(1, target), pageCount));
  };

  const emptyState = (
    <DataPlaceholder
      loading={loading}
      error={error}
      empty={emptyText}
      loadingLabel={`Loading ${title.toLowerCase()}...`}
    />
  );
  const isEmpty = loading || error || ranked.length === 0;
  // A paged table always ends in the grey footer band, even on one page.
  const hasFooter = Boolean(pageSize) && !isEmpty;

  return (
    // The footer band sits flush with the card's bottom edge, so the card drops
    // its bottom padding and clips the band to its rounded corners.
    <Card className={cn(hasFooter && "overflow-hidden pb-0")}>
      {/* Title left, tabs right, level from md (Adrian). */}
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {tabs}
      </CardHeader>

      <CardContent>
        <div className="-mx-6 hidden md:block">
          <Table>
            {/* Column titles on a light grey band, so they read as headings rather
                than as the first row (Adrian). */}
            <TableHeader>
              <TableRow className="border-t bg-muted/60 hover:bg-muted/60">
                <TableHead className="h-9 pl-6 text-xs font-medium text-muted-foreground">
                  {placeLabel}
                </TableHead>
                <TableHead className="h-9 text-xs font-medium text-muted-foreground">{headLabel}</TableHead>
                <TableHead className="h-9 w-[30%] text-xs font-medium text-muted-foreground">
                  Approved
                </TableHead>
                <TableHead className="h-9 pr-6 text-right text-xs font-medium text-muted-foreground">
                  Referrals
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isEmpty ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="py-6 text-center">
                    {emptyState}
                  </TableCell>
                </TableRow>
              ) : (
                shown.map((row) => (
                  <TableRow key={row.code}>
                    <TableCell className="pl-6">
                      <div className="text-xs font-medium">{row.name}</div>
                      {showParent && row.parentName ? (
                        <div className="text-[10px] text-muted-foreground">{row.parentName}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <HeadChip row={row} noHeadLabel={noHeadLabel} />
                    </TableCell>
                    <TableCell>
                      <ApprovalBar rate={row.rate} />
                    </TableCell>
                    <TableCell className="pr-6 text-right font-medium tabular-nums">
                      {formatCount(row.total)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className={cn("-mx-6 divide-y border-t md:hidden", !hasFooter && "border-b")}>
          {isEmpty ? (
            <div className="px-6 py-6 text-center">{emptyState}</div>
          ) : (
            shown.map((row) => (
              <div key={row.code} className="space-y-2 px-6 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium">{row.name}</div>
                    {showParent && row.parentName ? (
                      <div className="text-[10px] text-muted-foreground">{row.parentName}</div>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-medium tabular-nums">{formatCount(row.total)}</div>
                    <div className="text-xs text-muted-foreground">referrals</div>
                  </div>
                </div>
                <HeadChip row={row} noHeadLabel={noHeadLabel} />
                <ApprovalBar rate={row.rate} />
              </div>
            ))
          )}
        </div>

        {/* The footer band -- light grey like the column titles (Adrian):
            "Showing 1–10 of 136" on the left, shadcn's Pagination on the right.
            Always there on a paged table; one page shows just "1". The paging is
            done here over the rows already fetched -- the API returns every
            branch in one go, so there is no page parameter to send. */}
        {hasFooter ? (
          <div className="-mx-6 flex min-h-12 items-center justify-between gap-3 border-t bg-muted/60 px-6 py-2">
            <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
              Showing {firstIndex + 1}–{Math.min(firstIndex + pageSize, ranked.length)} of{" "}
              {ranked.length}
            </span>
            <Pagination className="mx-0 w-full justify-center sm:w-auto sm:justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={goTo(currentPage - 1)}
                    aria-disabled={currentPage <= 1}
                    className={cn("text-xs", currentPage <= 1 && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
                {pageItems(currentPage, pageCount).map((item, index) =>
                  item === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        href="#"
                        onClick={goTo(item)}
                        isActive={item === currentPage}
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
                    onClick={goTo(currentPage + 1)}
                    aria-disabled={currentPage >= pageCount}
                    className={cn(
                      "text-xs",
                      currentPage >= pageCount && "pointer-events-none opacity-50",
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        ) : null}      </CardContent>
    </Card>
  );
}

/**
 * A head: picture, name, user code. Names text-xs, the code a step smaller and
 * muted, picture 24px (Adrian). A place can have none.
 */
function HeadChip({ row, noHeadLabel }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <UserAvatar src={row.headAvatarSrc} name={row.headName} size="sm" />
      <div className="min-w-0">
        <div className={cn("truncate text-xs", row.headName ? "font-medium" : "text-muted-foreground")}>
          {row.headName ?? noHeadLabel}
        </div>
        {row.headUserCode ? (
          <div className="truncate text-[10px] text-muted-foreground">{row.headUserCode}</div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Approved as a share of the place's referrals: shadcn's Progress in #00bb7c,
 * and the figure beside it. 0, not null, for a place with no referrals -- null
 * draws an indeterminate bar that reads as "loading".
 */
function ApprovalBar({ rate }) {
  return (
    <div className="flex items-center gap-2">
      <Progress
        value={rate ?? 0}
        aria-label="Approved"
        className="flex-1 [&_[data-slot=progress-indicator]]:bg-[#00bb7c]"
      />
      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {rate != null ? `${rate}%` : "—"}
      </span>
    </div>
  );
}
