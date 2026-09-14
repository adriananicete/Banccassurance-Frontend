/**
 * The Department Head's dashboard, built on context/FRONTEND_DESIGN_PATTERN.md.
 * Header, the region choice, then the chart with a side panel beside it --
 * Regions while every region is showing, that region's Overview once one is
 * picked -- and below them a table of the groups under the regions.
 *
 * Presentational and CONTROLLED. `pages/DashboardPage.jsx` owns the period and
 * the region, because both change which requests are made, and hands down
 * figures already shaped for the period by `../dashboardData.js`. Nothing here
 * computes a period.
 *
 * WHAT THIS SCREEN IS FOR. A Department Head oversees the whole PhilLife
 * tenant. They do not refer and do not work referrals -- an Account Officer
 * does that. So this answers "where do we stand, and which region is behind",
 * and deliberately shows no per-status detail.
 *
 * The props contract:
 *
 *   preset / onPresetChange   The period. Custom is not offered until there is
 *                a date picker.
 *   selected / onSelect       ALL_REGIONS or a region code. The top buttons and
 *                the Groups tabs are both this one value.
 *   tenant       { total, approved } for all of PhilLife over the period.
 *   regions      [{ code, name, total, approved, headName, headUserCode,
 *                headAvatarSrc }] -- every region, over the period, zero
 *                included. Head fields MAY BE NULL: totals are grouped by
 *                geography, so a region can sit without a head.
 *   monthly      [{ month: "2026-09", referrals, approved }] for the tenant or
 *                the picked region, for the chart's YEAR -- January through
 *                now, or all twelve months of a past year. Not the period.
 *   chartYear / chartYears / onChartYearChange   The chart's year dropdown.
 *                `chartYears` runs from the first referral's year to now.
 *   groups       [{ code, name, regionName, total, approved, headName,
 *                headUserCode, headAvatarSrc }] -- the groups in view. One Area
 *                Sales Head may hold several, so a name can repeat.
 *   summaryLoading / summaryError   Headline, Regions and Overview.
 *   chartLoading / chartError       The chart.
 *   groupsLoading / groupsError     The Groups table.
 *   onExport(preset) / isExporting / exportError
 */
import { ChartPie, CircleCheck, Download, FileText, Percent } from "lucide-react";
import { TbChartAreaLine } from "react-icons/tb";

import { ChartAreaGradient } from "@/components/charts/ChartAreaGradient";
import { OptionCombobox } from "@/components/OptionCombobox";
import { DataPlaceholder } from "@/components/DataPlaceholder";
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
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DATE_PRESET, DATE_PRESETS } from "@/constants/presets";
import { cn } from "@/lib/utils";

import { ALL_REGIONS as ALL } from "../dashboardData";

/**
 * The periods on offer. Custom is left out until there is a date picker --
 * without dates it could only ever show a dash (Adrian, 2026-09-14).
 */
const PERIOD_OPTIONS = DATE_PRESETS.filter((option) => option.value !== DATE_PRESET.CUSTOM);

/** Approved as a whole percentage of referrals, or null when there is nothing to divide. */
function conversionRate(approved, total) {
  if (!total || approved == null) return null;
  return Math.round((approved / total) * 100);
}

function formatCount(value) {
  return value == null ? null : value.toLocaleString("en-PH");
}

function presetLabel(value) {
  return DATE_PRESETS.find((option) => option.value === value)?.label.toLowerCase() ?? "";
}

export function DepartmentHeadDashboard({
  preset,
  onPresetChange,
  selected,
  onSelect,
  tenant = { total: null, approved: null },
  regions = [],
  monthly = [],
  chartYear,
  chartYears = [],
  onChartYearChange,
  groups = [],
  summaryLoading = false,
  summaryError = null,
  chartLoading = false,
  chartError = null,
  groupsLoading = false,
  groupsError = null,
  onExport,
  isExporting = false,
  exportError = null,
}) {
  const period = presetLabel(preset);

  // `find` rather than trusting `selected`: a selection that no longer names a
  // region renders everything instead of a blank number.
  const activeRegion = regions.find((region) => region.code === selected) ?? null;
  const scope = activeRegion ?? { name: "All of PhilLife", ...tenant };

  const rate = conversionRate(scope.approved, scope.total);
  // The region's share of PhilLife's referrals over the same period: the
  // region's row over the sum of every region's row, both from one call.
  const share =
    activeRegion && tenant.total > 0
      ? Math.round((activeRegion.total / tenant.total) * 100)
      : activeRegion
        ? 0
        : null;

  return (
    // DOM order is the phone order: header, region choice, chart, the side
    // panel, then the groups table. From lg the chart and the side panel share a
    // row, three fifths to two fifths.
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-semibold md:text-2xl">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Where PhilLife stands, and which region is behind
            </p>
          </div>

          <ExportControl
            preset={preset}
            onPresetChange={onPresetChange}
            onExport={onExport}
            isExporting={isExporting}
            exportError={exportError}
          />
        </div>

        <RegionScope regions={regions} selected={selected} onSelect={onSelect} />
      </div>

      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[3fr_2fr]">
        {/* Explicit height, so the card inside fills it and the chart takes what
            is left, rather than the chart deciding the page's height. */}
        <div className="h-[26rem] md:h-96">
          <ChartAreaGradient
            data={monthly}
            headline={scope.total}
            headlineLabel={`Total referrals · ${period}`}
            title="Referrals by month"
            description={`${scope.name} · ${chartYear}`}
            year={chartYear}
            years={chartYears}
            onYearChange={onChartYearChange}
            empty="No referrals in this period."
            loading={chartLoading}
            error={chartError}
          />
        </div>

        {/* The slot beside the chart. With every region showing it is the way
            INTO a region; once one is picked it becomes that region's figures.
            Same height as the chart from lg, and scrolls inside if it must. */}
        <div className="lg:h-96">
          {activeRegion ? (
            <OverviewCard
              scope={scope}
              share={share}
              rate={rate}
              period={period}
              loading={summaryLoading}
              error={summaryError}
            />
          ) : (
            <RegionsCard
              regions={regions}
              total={tenant.total}
              period={period}
              selected={selected}
              onSelect={onSelect}
              loading={summaryLoading}
              error={summaryError}
            />
          )}
        </div>
      </div>

      <GroupsCard
        regions={regions}
        groups={groups}
        selected={selected}
        onSelect={onSelect}
        period={period}
        loading={groupsLoading}
        error={groupsError}
      />
    </div>
  );
}

/**
 * One region's figures, in the slot the Regions list leaves when a region is
 * picked, over the picked period. The fourth tile was Stalled until the
 * backend withdrew R4 -- stalled belongs on the dashboards of the people who
 * move referrals -- and is now the region's share of PhilLife (Adrian).
 */
function OverviewCard({ scope, share, rate, period, loading, error }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Overview</CardTitle>
        <CardDescription>
          {scope.name} · {period}
        </CardDescription>
        {/* Who runs this region, beside what it did. CardAction puts it in the
            header's right column, level with the title. A region without a
            head says so rather than leaving the corner empty. */}
        <CardAction className="flex min-w-0 items-center gap-2">
          <UserAvatar src={scope.headAvatarSrc} name={scope.headName} size="md" />
          <div className="min-w-0">
            <div className="truncate text-xs font-medium">
              {scope.headName ?? "No one assigned"}
            </div>
            <div className="truncate text-xs text-muted-foreground">Regional Sales Head</div>
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
              label={`Share of PhilLife · ${period}`}
              value={share != null ? `${share}%` : null}
              icon={ChartPie}
              hint="Of all PhilLife referrals"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * The period, and the download.
 *
 * The period drives the whole screen: the headline, the chart, the Regions or
 * Overview panel, and the Groups table. The EXPORT does not follow the region
 * -- it is always the caller's whole scope (backend Q2) -- so the button says
 * so, rather than looking like it downloads what the tabs show.
 */
function ExportControl({ preset, onPresetChange, onExport, isExporting, exportError }) {
  return (
    <div className="flex flex-col gap-1 sm:items-end">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <OptionCombobox
          options={PERIOD_OPTIONS}
          value={preset}
          onChange={onPresetChange}
          label="Period"
          placeholder="Select a period"
          emptyText="No periods found."
          className="w-full sm:w-40"
        />

        <button
          type="button"
          onClick={() => onExport?.(preset)}
          disabled={isExporting}
          className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
        >
          <Download aria-hidden className="size-3.5" />
          {isExporting ? "Exporting…" : "Export all of PhilLife"}
        </button>
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
 * Which place the tiles and the chart describe. Built from `regions`, so a
 * region added in the data needs nothing added here.
 */
function RegionScope({ regions, selected, onSelect }) {
  const options = [{ code: ALL, name: "All regions" }, ...regions];

  return (
    <div
      role="group"
      aria-label="Region"
      className="flex w-full rounded-lg bg-muted p-1 sm:w-fit"
    >
      {options.map((option) => (
        <button
          key={option.code}
          type="button"
          onClick={() => onSelect(option.code)}
          aria-pressed={selected === option.code}
          className={cn(
            "flex-1 cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors sm:flex-none",
            selected === option.code
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.name}
        </button>
      ))}
    </div>
  );
}

/**
 * One hover tint per region -- the only per-region colour on the card, and
 * Adrian's pick. Assigned by the region's position in `regions`, NOT by rank,
 * so a row keeps its tint when the period reorders the list. Faint, with a
 * dark pair. Full class strings, so Tailwind can see them.
 */
const REGION_HOVERS = [
  "hover:bg-indigo-50/70 dark:hover:bg-indigo-500/10",
  "hover:bg-cyan-50/70 dark:hover:bg-cyan-500/10",
  "hover:bg-amber-50/70 dark:hover:bg-amber-500/10",
  "hover:bg-rose-50/70 dark:hover:bg-rose-500/10",
];

/**
 * The regions, ranked by conversion -- NOT by volume. In volume order the
 * biggest region always sits on top and the weakest closer sits at the bottom
 * where nobody looks.
 *
 * Each row is also the way into that region: pressing it picks it above, and
 * the picked row stays highlighted so the two controls cannot disagree.
 */
function RegionsCard({ regions, total, period, selected, onSelect, loading, error }) {
  // Tint follows the region's place in `regions`; order follows conversion.
  // Copy before sorting: `sort` mutates.
  const ranked = regions
    .map((region, index) => ({ ...region, hover: REGION_HOVERS[index % REGION_HOVERS.length] }))
    .sort(
      (a, b) =>
        (conversionRate(b.approved, b.total) ?? 0) - (conversionRate(a.approved, a.total) ?? 0),
    );

  return (
    // The card itself carries the design: a faint blue wash from the top that
    // fades into the card colour, and a blue-tinted border, both keyed to the
    // title icon. The rows inside stay plain.
    // Tighter than the Card default (py-6, gap-6): the header was too airy for a
    // panel this short, per Adrian. The rows keep their own px-6.
    <Card className="h-full gap-3 py-4 border-blue-100 bg-linear-to-b from-blue-50/80 via-card to-card dark:border-blue-500/20 dark:from-blue-500/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {/* Decorative. Blue to match the referrals series in the chart beside
              it, with a dark pair so it reads in both themes. */}
          <span
            aria-hidden
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
          >
            <TbChartAreaLine className="size-4" />
          </span>
          Regions
        </CardTitle>
        <CardDescription>Ranked by conversion · {period}</CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-auto">
        {loading || error || !total ? (
          // Not three rows of zeroes. A column of zeroes reads as a broken
          // query rather than as "nothing yet".
          <DataPlaceholder
            loading={loading}
            error={error}
            empty="No referrals in this period. Regional figures appear once branches refer."
            loadingLabel="Loading regions..."
          />
        ) : (
          <ul className="-mx-6 divide-y border-y">
            {ranked.map((region) => {
              const rate = conversionRate(region.approved, region.total);
              const share = Math.round((region.total / total) * 100);
              const isSelected = selected === region.code;

              return (
                <li key={region.code}>
                  <button
                    type="button"
                    onClick={() => onSelect(isSelected ? ALL : region.code)}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex w-full cursor-pointer flex-col gap-2 px-6 py-3 text-left transition-colors",
                      isSelected ? "bg-muted" : region.hover,
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium">{region.name}</div>
                        {/* Null is ordinary, and the gap is worth reading --
                            the avatar shows an empty-seat icon rather than
                            disappearing. */}
                        <div className="mt-1 flex min-w-0 items-center gap-1.5">
                          <UserAvatar
                            src={region.headAvatarSrc}
                            name={region.headName}
                            size="sm"
                          />
                          <span className="truncate text-xs text-muted-foreground">
                            {region.headName
                              ? `${region.headName} · ${region.headUserCode}`
                              : "No Regional Sales Head assigned"}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        {/* Blue, Adrian's colour for referrals -- the same blue as
                            the chart's referrals line. Lighter in dark mode,
                            where #155dfc is too deep to read on the card. */}
                        <div className="font-medium tabular-nums text-[#155dfc] dark:text-blue-400">
                          {region.total.toLocaleString("en-PH")}
                        </div>
                        <div className="text-xs text-muted-foreground">referrals</div>
                      </div>
                    </div>

                    {/* The bar is the conversion rate, matching the ranking, so
                        the two can never disagree. The line under it says the
                        same figure in words. shadcn's Progress in #00bb7c --
                        green for approved, as in the Groups table; 0 rather
                        than null so an empty region never draws as
                        indeterminate. */}
                    <Progress
                      value={rate ?? 0}
                      aria-label={`${region.name} approved`}
                      className="w-full [&_[data-slot=progress-indicator]]:bg-[#00bb7c]"
                    />

                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="tabular-nums">
                        {rate != null ? `${rate}% approved` : "No referrals in this period"}
                      </span>
                      <span className="tabular-nums">{share}% of PhilLife</span>
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
 * The groups under the regions, one row each: the group, its Area Sales Head,
 * how much of its referrals were approved, and how many it had.
 *
 * The tabs above the table ARE the region choice at the top of the dashboard
 * -- the same state, not a copy -- so picking NCR in either place narrows the
 * chart, the side panel and this table together (Adrian's call). The period
 * dropdown narrows it too.
 *
 * Ranked by approval, like the Regions card, so a group that is not closing
 * does not hide under a big one. A group with no referrals in the period sinks
 * to the bottom rather than reading as 0%.
 *
 * One component, two renderings (pattern §6): a real table from md up, a card
 * list below it -- never a table scrolling sideways on a phone.
 */
function GroupsCard({ regions, groups, selected, onSelect, period, loading, error }) {
  const showAll = !regions.some((region) => region.code === selected);
  const scopeName = showAll ? "All of PhilLife" : regions.find((r) => r.code === selected).name;

  // `groups` arrives already narrowed to the region in view and to the period.
  const rows = groups
    .map((group) => ({ ...group, rate: conversionRate(group.approved, group.total) }))
    .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1));

  const emptyState = (
    <DataPlaceholder
      loading={loading}
      error={error}
      empty="No groups with referrals or an Area Sales Head in this region yet."
      loadingLabel="Loading groups..."
    />
  );
  const isEmpty = loading || error || rows.length === 0;

  return (
    <Card>
      {/* Title on the left, tabs on the right, level with each other from md
          (space-between, per Adrian). Stacked on a phone, where the tabs take
          the full width. */}
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5">
          <CardTitle>Groups</CardTitle>
          <CardDescription>
            {scopeName} · ranked by approval · {period}
          </CardDescription>
        </div>
        <RegionScope regions={regions} selected={showAll ? ALL : selected} onSelect={onSelect} />
      </CardHeader>

      <CardContent>
        {/* Desktop: the table. Edge to edge inside the card, so the first and
            last columns carry the card's own padding. */}
        <div className="-mx-6 hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6 text-xs text-muted-foreground">Group</TableHead>
                <TableHead className="text-xs text-muted-foreground">Area Sales Head</TableHead>
                <TableHead className="w-[30%] text-xs text-muted-foreground">Approved</TableHead>
                <TableHead className="pr-6 text-right text-xs text-muted-foreground">
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
                rows.map((row) => (
                  <TableRow key={row.code}>
                    <TableCell className="pl-6">
                      <div className="text-xs font-medium">{row.name}</div>
                      {showAll ? (
                        <div className="text-[10px] text-muted-foreground">{row.regionName}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <HeadChip row={row} />
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

        {/* Phone: the same rows as a list. Four facts each -- group, head,
            approval, referrals. */}
        <div className="-mx-6 divide-y border-y md:hidden">
          {isEmpty ? (
            <div className="px-6 py-6 text-center">{emptyState}</div>
          ) : (
            rows.map((row) => (
              <div key={row.code} className="space-y-2 px-6 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium">{row.name}</div>
                    {showAll ? (
                      <div className="text-[10px] text-muted-foreground">{row.regionName}</div>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-medium tabular-nums">{formatCount(row.total)}</div>
                    <div className="text-xs text-muted-foreground">referrals</div>
                  </div>
                </div>
                <HeadChip row={row} />
                <ApprovalBar rate={row.rate} />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * An Area Sales Head: picture, name, user code. A group can have none.
 *
 * Sized down with the Group column (Adrian): the name at text-xs, and the
 * secondary line -- user code here, region under a group -- a step smaller
 * again at 10px, so the muted text reads as secondary. The picture is sm (24px)
 * to sit with the smaller text.
 */
function HeadChip({ row }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <UserAvatar src={row.headAvatarSrc} name={row.headName} size="sm" />
      <div className="min-w-0">
        <div className={cn("truncate text-xs", row.headName ? "font-medium" : "text-muted-foreground")}>
          {row.headName ?? "No Area Sales Head"}
        </div>
        {row.headUserCode ? (
          <div className="truncate text-[10px] text-muted-foreground">{row.headUserCode}</div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Approved as a share of the group's referrals: shadcn's Progress, and the
 * figure beside it.
 *
 * #00bb7c is Adrian's colour for this bar, set here once and reached through
 * the indicator's data-slot rather than by editing ui/progress.jsx. A group
 * with no referrals passes 0, not null -- null would make Base UI draw an
 * indeterminate bar, which reads as "loading".
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