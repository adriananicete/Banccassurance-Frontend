/**
 * The Department Head's dashboard, built on context/FRONTEND_DESIGN_PATTERN.md.
 * Header, the region choice, then the chart with a side panel beside it --
 * Regions while every region is showing, that region's Overview once one is
 * picked -- and below them the work waiting on the DH and the activity feed.
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
 *                headUserCode, monthly }]. Three today: NCR, Luzon, VisMin.
 *                Each carries its own figures and its own `monthly`, so picking
 *                a region re-scopes the tiles and the chart without a request.
 *                ⚠️ `headName` and `headUserCode` MAY BE NULL. Totals are
 *                grouped by geography, not by person, so a region can sit
 *                without a head and still have history.
 *   pendingApprovals   Number. Regional Sales Heads waiting on this DH.
 *   unassignedHeads    Number. Approved RSHs holding no region yet. Such an
 *                      account sees an empty dashboard with nothing explaining
 *                      why, and the DH is the only role who can fix it.
 *   unassignedOfficers Number. Account Officers holding no branches. A tier
 *                      below the DH, but they are the only one who sees the
 *                      whole tenant, and such an account cannot refer at all.
 *   notifications  [{ id, text, at }]. `at` is a UTC timestamp.
 *   loading / error    For the cold load, once the API is wired.
 *   onExport     (preset) => void. Optional until GET /reports/export is wired.
 */
import { useState } from "react";
import {
  ArrowRight,
  CircleCheck,
  Clock,
  Download,
  FileText,
  Percent,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { Link } from "react-router";

import { ChartAreaGradient } from "@/components/charts/ChartAreaGradient";
import { DataPlaceholder } from "@/components/DataPlaceholder";
import { StatTile } from "@/components/StatTile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DATE_PRESET, DATE_PRESETS } from "@/constants/presets";
import { formatRelative } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";

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

export function DepartmentHeadDashboard({
  total,
  approved,
  stalled,
  stalledDays,
  monthly = [],
  regions = [],
  pendingApprovals = 0,
  unassignedHeads = 0,
  unassignedOfficers = 0,
  notifications = [],
  loading = false,
  error = null,
  onExport,
}) {
  const [selected, setSelected] = useState(ALL);

  // `find` rather than trusting `selected`: if the regions change under a
  // selection that no longer exists, this falls back to everything instead of
  // rendering a blank number.
  const activeRegion = regions.find((region) => region.code === selected) ?? null;

  // The region choice narrows the PLACE, never the period. Everything scoped
  // below is still all time.
  const scope = activeRegion
    ? {
        name: activeRegion.name,
        total: activeRegion.total,
        approved: activeRegion.approved,
        stalled: activeRegion.stalled,
        monthly: activeRegion.monthly ?? [],
      }
    : { name: "All of PhilLife", total, approved, stalled, monthly };

  const rate = conversionRate(scope.approved, scope.total);
  const share =
    activeRegion && total > 0 ? Math.round((activeRegion.total / total) * 100) : null;

  return (
    // DOM order is the phone order: header, region choice, chart, the side
    // panel, then the two lists. From lg the chart and the side panel share a
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

          <ExportControl onExport={onExport} />
        </div>

        <RegionScope regions={regions} selected={selected} onSelect={setSelected} />
      </div>

      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[3fr_2fr]">
        {/* Explicit height, so the card inside fills it and the chart takes what
            is left, rather than the chart deciding the page's height. */}
        <div className="h-[26rem] md:h-96">
          <ChartAreaGradient
            data={scope.monthly}
            title="Referrals by month"
            description={`${scope.name} · referred and approved, month by month`}
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
              stalledDays={stalledDays}
              loading={loading}
              error={error}
            />
          ) : (
            <RegionsCard
              regions={regions}
              total={total}
              selected={selected}
              onSelect={setSelected}
              loading={loading}
              error={error}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2">
        <AttentionCard
          pendingApprovals={pendingApprovals}
          unassignedHeads={unassignedHeads}
          unassignedOfficers={unassignedOfficers}
          stalled={stalled}
          stalledDays={stalledDays}
          regions={regions}
          loading={loading}
          error={error}
        />

        <ActivityCard notifications={notifications} loading={loading} error={error} />
      </div>
    </div>
  );
}

/**
 * One region's figures, in the slot the Regions list leaves when a region is
 * picked. All time, like everything else here -- the pick narrows the place.
 */
function OverviewCard({ scope, share, rate, stalledDays, loading, error }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Overview</CardTitle>
        <CardDescription>{scope.name} · all time</CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-auto">
        {loading || error ? (
          <DataPlaceholder loading={loading} error={error} loadingLabel="Loading figures..." />
        ) : (
          <div className="grid auto-rows-fr grid-cols-2 gap-3">
            <StatTile
              label="Referrals · all time"
              value={formatCount(scope.total)}
              icon={FileText}
              accent="total"
              hint={share != null ? `${share}% of PhilLife` : null}
            />
            <StatTile
              label="Approved · all time"
              value={formatCount(scope.approved)}
              icon={CircleCheck}
              accent="done"
              hint={scope.total != null ? `Of ${formatCount(scope.total)} referrals` : null}
            />
            <StatTile
              label="Conversion · all time"
              value={rate != null ? `${rate}%` : null}
              icon={Percent}
              hint="Approved out of referred"
            />
            <StatTile
              label={`Stalled · ${stalledDays}+ days`}
              value={formatCount(scope.stalled)}
              icon={Clock}
              accent="queue"
              hint={`No status change in ${stalledDays} days`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * THE PERIOD BELONGS TO THE EXPORT, not to the screen. Every figure here is
 * all time and cannot be narrowed -- the dashboard endpoint binds no date -- so
 * a period control standing alone would look like a filter that does nothing.
 * GET /reports/export does take these presets, so joined to the button it is
 * real.
 */
function ExportControl({ onExport }) {
  const [preset, setPreset] = useState(DATE_PRESET.ALL_TIME);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label htmlFor="dashboard-export-period" className="sr-only">
        Period to export
      </label>
      <select
        id="dashboard-export-period"
        value={preset}
        onChange={(event) => setPreset(event.target.value)}
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
 * The things only a Department Head is placed to fix. Tenant-wide whichever
 * region is picked -- a queue does not belong to a region. Each row hides at
 * zero; an empty queue is not news.
 */
function AttentionCard({
  pendingApprovals,
  unassignedHeads,
  unassignedOfficers,
  stalled,
  stalledDays,
  regions,
  loading,
  error,
}) {
  // Point at the region carrying most of the stall, rather than a hardcoded
  // name that goes stale the day the numbers move.
  const worstStalled = regions.reduce(
    (worst, region) => ((region.stalled ?? 0) > (worst?.stalled ?? 0) ? region : worst),
    null,
  );

  const items = [
    unassignedHeads > 0 && {
      key: "heads",
      Icon: UserPlus,
      to: paths.people,
      label:
        unassignedHeads === 1
          ? "1 Regional Sales Head has no region yet"
          : `${unassignedHeads} Regional Sales Heads have no region yet`,
      note: "Until they do, their screens are empty and nothing says why.",
    },
    pendingApprovals > 0 && {
      key: "approvals",
      Icon: UserCheck,
      to: paths.approvals,
      label:
        pendingApprovals === 1
          ? "1 account is waiting for your approval"
          : `${pendingApprovals} accounts are waiting for your approval`,
    },
    unassignedOfficers > 0 && {
      key: "officers",
      Icon: Users,
      to: paths.people,
      label:
        unassignedOfficers === 1
          ? "1 Account Officer holds no branches"
          : `${unassignedOfficers} Account Officers hold no branches`,
      note: "They cannot create referrals until an Area Sales Head assigns them.",
    },
    stalled > 0 && {
      key: "stalled",
      Icon: Clock,
      to: paths.referrals,
      label: `${stalled} referrals have not moved in ${stalledDays} days`,
      note: worstStalled
        ? `Most are in ${worstStalled.name} (${worstStalled.stalled}). Worth asking its Regional Sales Head why.`
        : null,
    },
  ].filter(Boolean);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Needs your attention</CardTitle>
        <CardDescription>Across PhilLife, whichever region is picked</CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        {loading || error || items.length === 0 ? (
          <DataPlaceholder
            loading={loading}
            error={error}
            empty="Nothing is waiting on you right now."
            loadingLabel="Loading your queue..."
          />
        ) : (
          <ul className="-mx-6 divide-y border-y">
            {items.map(({ key, Icon, to, label, note }) => (
              <li key={key}>
                <Link
                  to={to}
                  className="group flex items-start gap-3 px-6 py-3 transition-colors hover:bg-muted/50"
                >
                  <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span className="text-sm font-medium">{label}</span>
                    {note ? (
                      <span className="text-xs text-muted-foreground">{note}</span>
                    ) : null}
                  </span>
                  <ArrowRight
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * The regions, ranked by conversion -- NOT by volume. In volume order the
 * biggest region always sits on top and the weakest closer sits at the bottom
 * where nobody looks.
 *
 * Each row is also the way into that region: pressing it picks it above, and
 * the picked row stays highlighted so the two controls cannot disagree.
 */
function RegionsCard({ regions, total, selected, onSelect, loading, error }) {
  // Copy first: `sort` mutates, and this array is a prop.
  const ranked = [...regions].sort(
    (a, b) =>
      (conversionRate(b.approved, b.total) ?? 0) - (conversionRate(a.approved, a.total) ?? 0),
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Regions</CardTitle>
        <CardDescription>Ranked by conversion · all time</CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-auto">
        {loading || error || !total ? (
          // Not three rows of zeroes. A column of zeroes reads as a broken
          // query rather than as "nothing yet".
          <DataPlaceholder
            loading={loading}
            error={error}
            empty="No referrals yet. Regional figures appear once branches start referring."
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
                      isSelected ? "bg-muted" : "hover:bg-muted/50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium">{region.name}</div>
                        {/* Null is ordinary, and the gap is worth reading. */}
                        <div className="truncate text-xs text-muted-foreground">
                          {region.headName
                            ? `${region.headName} · ${region.headUserCode}`
                            : "No Regional Sales Head assigned"}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-medium tabular-nums">
                          {rate != null ? `${rate}%` : "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">converted</div>
                      </div>
                    </div>

                    {/* The bar is the conversion rate, matching the ranking, so
                        the two can never disagree. */}
                    <div aria-hidden className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${rate ?? 0}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="tabular-nums">
                        {region.total.toLocaleString("en-PH")} referrals · {share}% of PhilLife
                      </span>
                      {region.stalled > 0 ? (
                        <span className="tabular-nums">{region.stalled} stalled</span>
                      ) : null}
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

function ActivityCard({ notifications, loading, error }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Latest activity</CardTitle>
        <CardDescription>The most recent changes across PhilLife</CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        {loading || error || notifications.length === 0 ? (
          <DataPlaceholder
            loading={loading}
            error={error}
            empty="No activity yet."
            loadingLabel="Loading activity..."
          />
        ) : (
          <ul className="-mx-6 divide-y border-y">
            {notifications.map((item) => (
              <li
                key={item.id}
                className="flex items-baseline justify-between gap-4 px-6 py-3 text-sm"
              >
                <span>{item.text}</span>
                {/* Relative: on a feed the gap is the useful part. */}
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatRelative(item.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
