/**
 * The Department Head's dashboard, built on context/FRONTEND_DESIGN_PATTERN.md.
 * Header, the region choice, then the chart with a side panel beside it --
 * Regions while every region is showing, that region's Overview once one is
 * picked -- and below them a table of the groups under the regions.
 *
 * Presentational. `pages/DashboardPage.jsx` supplies every prop. Right now it
 * supplies HARDCODED numbers -- when the API is wired, only that file changes.
 *
 * WHAT THIS SCREEN IS FOR. A Department Head oversees the whole PhilLife
 * tenant. They do not refer and do not work referrals -- an Account Officer
 * does that. So this answers "where do we stand, and which region is behind",
 * and deliberately shows no per-status detail.
 *
 * The props contract:
 *
 *   total        Number. Every referral in PhilLife. ALWAYS ALL TIME -- there
 *                is no date filter and there cannot be one, because one of the
 *                two stored procedures behind the endpoint takes no date. Every
 *                label on screen says so, or the number reads as "this month".
 *   approved     Number. How many of `total` reached Approved. The half a bare
 *                total cannot show: 310 referrals reads the same whether all
 *                310 closed or none did.
 *   stalled      Number, with `stalledDays`. Referrals whose status has not
 *                moved in that long.
 *                ⚠️ FOURTEEN DAYS IS AN ASSUMPTION, not a rule from anywhere.
 *                Nothing in BusinessLogic.md defines when a referral counts as
 *                stuck. Confirm it before this number is shown to anyone.
 *   monthly      [{ month: "2026-04", referrals, approved }] for the whole
 *                tenant. ⚠️ NO SOURCE IN THE API YET -- see DashboardPage.
 *   regions      [{ code, name, total, approved, stalled, headName,
 *                headUserCode, headAvatarSrc, monthly, groups }]. Three today: NCR,
 *                Luzon, VisMin. `headAvatarSrc` is an absolute URL or null --
 *                the container builds it with `avatarUrl(photo)`.
 *                Each carries its own figures and its own `monthly`, so picking
 *                a region re-scopes the tiles and the chart without a request.
 *                ⚠️ `headName` and `headUserCode` MAY BE NULL. Totals are
 *                grouped by geography, not by person, so a region can sit
 *                without a head and still have history.
 *                `groups` is [{ code, name, total, approved, headName,
 *                headUserCode, headAvatarSrc, monthly }] -- the groups under
 *                that region, each held by an Area Sales Head. One head may
 *                hold several groups, so a name can repeat. The head MAY BE NULL.
 *   (No approvals queue, activity feed or unassigned-account warnings here --
 *   Adrian replaced those cards with the groups table, 2026-09-14.)
 *   loading / error    For the cold load, once the API is wired.
 *   onExport     (preset) => void. Optional until GET /reports/export is wired.
 */
import { useState } from "react";
import { CircleCheck, Clock, Download, FileText, Percent } from "lucide-react";
import { TbChartAreaLine } from "react-icons/tb";

import { ChartAreaGradient } from "@/components/charts/ChartAreaGradient";
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
import { manilaToday } from "@/lib/datetime";
import { cn } from "@/lib/utils";

/** The "every region" choice. Not a region code, so it cannot collide with one. */
const ALL = "ALL";

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

/** How many calendar months each rolling preset covers, current month included. */
const PRESET_MONTHS = {
  [DATE_PRESET.THIS_MONTH]: 1,
  [DATE_PRESET.THREE_MONTHS]: 3,
  [DATE_PRESET.SIX_MONTHS]: 6,
};

/**
 * Referrals and approvals over the picked period, plus the months that make it
 * up -- for the tenant or for one region.
 *
 * All time reads the API's own totals, never a sum of the months, so the two
 * cannot disagree. The rolling presets add up the monthly series, running to
 * the end of the current Manila month like the backend's presets do. Custom
 * has no dates to read yet, so it answers nulls rather than a guess.
 *
 * "Last 3 months" counts the current month as one of the three -- Adrian's
 * call, 2026-09-14; the backend is asked to confirm it matches (Q1 in
 * BACKEND-REQUESTS.md).
 *
 * ⚠️ STAND-IN. The monthly series has no source (see DashboardPage). When
 * wired, GET /reports/summary with the same preset answers the totals directly
 * and this function goes.
 */
function figuresFor(preset, { total, approved, monthly = [] }) {
  if (preset === DATE_PRESET.ALL_TIME) {
    return { total: total ?? null, approved: approved ?? null, monthly };
  }
  if (preset === DATE_PRESET.CUSTOM) {
    return { total: null, approved: null, monthly: [] };
  }

  const currentMonth = manilaToday().slice(0, 7);
  const months = monthly.filter((point) => point.month <= currentMonth);
  const inPeriod =
    preset === DATE_PRESET.THIS_YEAR
      ? months.filter((point) => point.month.slice(0, 4) === currentMonth.slice(0, 4))
      : months.filter((point) => monthsBetween(point.month, currentMonth) < PRESET_MONTHS[preset]);

  return {
    total: inPeriod.reduce((sum, point) => sum + point.referrals, 0),
    approved: inPeriod.reduce((sum, point) => sum + point.approved, 0),
    monthly: inPeriod,
  };
}

/** Whole calendar months from `from` to `to`, both "YYYY-MM". */
function monthsBetween(from, to) {
  const [fromYear, fromMonth] = from.split("-").map(Number);
  const [toYear, toMonth] = to.split("-").map(Number);
  return (toYear - fromYear) * 12 + (toMonth - fromMonth);
}

export function DepartmentHeadDashboard({
  total,
  approved,
  stalled,
  stalledDays,
  monthly = [],
  regions = [],
  loading = false,
  error = null,
  onExport,
}) {
  const [selected, setSelected] = useState(ALL);
  const [preset, setPreset] = useState(DATE_PRESET.ALL_TIME);

  const isCustom = preset === DATE_PRESET.CUSTOM;
  const period = presetLabel(preset);

  // Everything in the chart row follows the period: the tenant's figures, and
  // each region's. `stalled` is left alone -- it is a count of referrals stuck
  // right now, and its own label says so.
  const tenant = figuresFor(preset, { total, approved, monthly });
  const periodRegions = regions.map((region) => ({ ...region, ...figuresFor(preset, region) }));

  // `find` rather than trusting `selected`: if the regions change under a
  // selection that no longer exists, this falls back to everything instead of
  // rendering a blank number.
  const activeRegion = periodRegions.find((region) => region.code === selected) ?? null;

  const scope = activeRegion
    ? { ...activeRegion }
    : { name: "All of PhilLife", stalled, ...tenant };

  const rate = conversionRate(scope.approved, scope.total);
  const share =
    activeRegion && tenant.total > 0
      ? Math.round((activeRegion.total / tenant.total) * 100)
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

          <ExportControl preset={preset} onPresetChange={setPreset} onExport={onExport} />
        </div>

        <RegionScope regions={regions} selected={selected} onSelect={setSelected} />
      </div>

      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[3fr_2fr]">
        {/* Explicit height, so the card inside fills it and the chart takes what
            is left, rather than the chart deciding the page's height. */}
        <div className="h-[26rem] md:h-96">
          <ChartAreaGradient
            data={scope.monthly}
            headline={scope.total}
            headlineLabel={
              isCustom
                ? "Total referrals · pick a date range to see a total"
                : `Total referrals · ${period}`
            }
            title="Referrals by month"
            description={`${scope.name} · referred and approved, ${period}`}
            empty={isCustom ? "Pick a date range to see the chart." : "No referrals in this period."}
            loading={loading}
            error={error}
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
              isCustom={isCustom}
              stalledDays={stalledDays}
              loading={loading}
              error={error}
            />
          ) : (
            <RegionsCard
              regions={periodRegions}
              total={tenant.total}
              period={period}
              isCustom={isCustom}
              selected={selected}
              onSelect={setSelected}
              loading={loading}
              error={error}
            />
          )}
        </div>
      </div>

      <GroupsCard
        regions={regions}
        selected={selected}
        onSelect={setSelected}
        preset={preset}
        period={period}
        isCustom={isCustom}
        loading={loading}
        error={error}
      />    </div>
  );
}

/**
 * One region's figures, in the slot the Regions list leaves when a region is
 * picked. Over the picked period, except Stalled, which is always "right now".
 */
function OverviewCard({ scope, share, rate, period, isCustom, stalledDays, loading, error }) {
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
              hint={
                isCustom ? "Pick a date range" : share != null ? `${share}% of PhilLife` : null
              }
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
              label={`Stalled · ${stalledDays}+ days`}
              value={formatCount(scope.stalled)}
              icon={Clock}
              accent="queue"
              hint="Right now, whatever the period"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * The period, and the download of it. The period drives the whole chart row --
 * the headline total, the chart, and the Regions or Overview panel beside it --
 * as well as what Export data downloads. The two lists below do not follow it:
 * a queue and a feed are about now.
 */
function ExportControl({ preset, onPresetChange, onExport }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label htmlFor="dashboard-export-period" className="sr-only">
        Period
      </label>
      <select
        id="dashboard-export-period"
        value={preset}
        onChange={(event) => onPresetChange(event.target.value)}
        className="h-8 w-full cursor-pointer rounded-md border border-input bg-background px-2.5 text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:w-40"
      >
        {DATE_PRESETS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => onExport?.(preset)}
        className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <Download aria-hidden className="size-3.5" />
        Export data
      </button>
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
function RegionsCard({ regions, total, period, isCustom, selected, onSelect, loading, error }) {
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
            empty={
              isCustom
                ? "Pick a date range to see the regions."
                : "No referrals in this period. Regional figures appear once branches refer."
            }
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
function GroupsCard({ regions, selected, onSelect, preset, period, isCustom, loading, error }) {
  const showAll = !regions.some((region) => region.code === selected);
  const scopeName = showAll ? "All of PhilLife" : regions.find((r) => r.code === selected).name;

  const rows = regions
    .filter((region) => showAll || region.code === selected)
    .flatMap((region) =>
      (region.groups ?? []).map((group) => {
        const figures = figuresFor(preset, group);
        return {
          ...group,
          ...figures,
          regionName: region.name,
          rate: conversionRate(figures.approved, figures.total),
        };
      }),
    )
    .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1));

  const emptyState = (
    <DataPlaceholder
      loading={loading}
      error={error}
      empty={
        isCustom
          ? "Pick a date range to see the groups."
          : "No groups under this region yet."
      }
      loadingLabel="Loading groups..."
    />
  );
  const isEmpty = loading || error || rows.length === 0 || isCustom;

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
 * again at 10px, so the muted text reads as secondary.
 */
function HeadChip({ row }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <UserAvatar src={row.headAvatarSrc} name={row.headName} size="md" />
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