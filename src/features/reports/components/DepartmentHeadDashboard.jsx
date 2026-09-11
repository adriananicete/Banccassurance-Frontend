/**
 * ============================================================================
 *  THIS FILE IS YOURS. Restyle it freely.
 * ============================================================================
 *
 * Presentational. `pages/DashboardPage.jsx` supplies every prop. Right now it
 * supplies HARDCODED numbers so you can design against something that looks
 * real -- when the API is wired, only that file changes and this one does not.
 *
 * WHAT THIS SCREEN IS FOR. A Department Head oversees the whole PhilLife
 * tenant. They do not refer and do not work referrals -- an Account Officer
 * does that. So this answers "where do we stand, and which region is behind",
 * and deliberately shows no per-status detail.
 *
 * The props contract:
 *
 *   approved     Number. How many of `total` reached Approved. The half a bare
 *                total cannot show: 310 referrals reads the same whether all
 *                310 closed or none did. Each region carries its own, so the
 *                figure follows the tab.
 *   stalled      Number, with `stalledDays`. Referrals whose status has not
 *                moved in that long.
 *                ⚠️ FOURTEEN DAYS IS AN ASSUMPTION, not a rule from anywhere.
 *                Nothing in BusinessLogic.md defines when a referral counts as
 *                stuck. Confirm it with whoever owns the process before this
 *                number is shown to them.
 *   unassignedOfficers  Number. Account Officers approved but holding no
 *                branches. A tier below what a DH acts on -- an Area Sales Head
 *                assigns those -- but the DH is the only one who sees the whole
 *                tenant, and such an account cannot refer at all.
 *   notifications  [{ id, text, at }]. `at` is a UTC timestamp.
 *   total        Number. Every referral in PhilLife. ALWAYS ALL TIME -- there
 *                is no date filter and there cannot be one, because one of the
 *                two stored procedures behind the endpoint takes no date. Say
 *                so on screen or the number reads as "this month".
 *   regions      [{ code, name, total, headName, headUserCode, groups }] -- THREE rows
 *                today: NCR, Luzon, VisMin. `banc.regions` holds three, and
 *                there is one Regional Sales Head each. Three is not enough
 *                for a table; cards are the better shape.
 *
 *                ⚠️ `headName` and `headUserCode` MAY BE NULL. The totals are
 *                grouped by region -- by geography, not by person -- on purpose:
 *                grouping by the people table would move a region's history
 *                whenever somebody changed job. So the head is a label beside
 *                the number, never the thing the number is counted by.
 *
 *                `monthly` is [{ month, desktop }] -- that region's own numbers
 *                for the bar chart, and they MUST sum to the region's `total`.
 *                It is what makes the bars a breakdown of the picked region
 *                rather than of the whole tenant.
 *                ⚠️ THERE IS NO TREND FIGURE AVAILABLE, anywhere. A "+8%" style
 *                badge would need this period against a previous one, and
 *                GET /reports/dashboard takes no period at all. The Regions
 *                panel shows share of the total instead -- 310 of 847 is 37% --
 *                which is a real number the same shape and answers the same
 *                question the badge was reaching for.
 *   pendingApprovals   Number. Regional Sales Heads waiting on this DH.
 *   unassignedHeads    Number. Approved RSHs holding no region yet. THIS ONE
 *                      MATTERS: such an account sees an empty dashboard with
 *                      nothing explaining why, and the DH is the only role who
 *                      can fix it.
 *
 * Pure-UI state may live here. Anything that touches the server belongs in the
 * container instead.
 */
import { useState } from "react";
import {
  LuArrowRight,
  LuClock,
  LuUserCheck,
  LuUserPlus,
  LuUsers,
} from "react-icons/lu";
import { Link } from "react-router";

import { ChartAreaDefault } from "@/components/charts/ChartAreaDefault";
import { ChartBarLabelCustom } from "@/components/charts/ChartBarLabelCustom";
import { DATE_PRESET, DATE_PRESETS } from "@/constants/presets";
import { formatRelative, formatWeekdayDate } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import { CiCalendarDate } from "react-icons/ci";
import { VscListFilter } from "react-icons/vsc";
import { BsDownload } from "react-icons/bs";
import { MdOutlineLandscape } from "react-icons/md";

/** The "everything" tab. Not a region code, so it cannot collide with one. */
const ALL = "ALL";

export function DepartmentHeadDashboard({
  total,
  approved,
  stalled,
  stalledDays,
  regions,
  pendingApprovals,
  unassignedHeads,
  unassignedOfficers,
  notifications = [],
}) {
  // Which tab is picked -- ALL, or a region's code.
  const [selected, setSelected] = useState(ALL);

  // The period the EXPORT covers. Nothing to do with the figures on screen --
  // see the note on the toolbar below.
  const [exportPreset, setExportPreset] = useState(DATE_PRESET.ALL_TIME);

  // `find` rather than trusting `selected`: if the regions change under a
  // selection that no longer exists, this falls back to everything instead of
  // rendering a blank number.
  const activeRegion =
    regions.find((region) => region.code === selected) ?? null;

  const shownTotal = activeRegion ? activeRegion.total : total;
  const shownApproved = activeRegion ? activeRegion.approved : approved;

  // Every one of these figures is all time -- the region tabs narrow the PLACE,
  // never the period. Saying so on each keeps the tab labelled "All time" from
  // implying the others are not.
  const shownDescription = activeRegion
    ? `${activeRegion.name} referrals · all time`
    : "Total referrals · all time";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold">Dashboard</h1>

        {/* Manila, like every other date on screen -- a viewer in another
            timezone should read the same day the data is filed under. */}
        <span className="text-xs text-muted-foreground">
          {formatWeekdayDate()}
        </span>
      </div>

      {/* The line under the headline is still shadcn's demo data. The headline
          number itself is the real one, and it follows the tab. */}
      <div className="flex h-96 flex-col gap-1">
        {/* Derived from `regions` rather than spelled out, so a region added or
            renamed in the data does not need a tab added here to match. */}
        <div className="flex justify-between items-center p-1 gap-3">
          <div className="h-full flex gap-3">
            {[{ code: ALL, name: "All time" }, ...regions].map((tab) => (
            <button
              key={tab.code}
              type="button"
              onClick={() => setSelected(tab.code)}
              aria-pressed={selected === tab.code}
              className={cn(
                "border cursor-pointer text-xs py-1 px-3 rounded-sm transition-colors",
                selected === tab.code
                  ? "bg-blue-950 text-white border-blue-950"
                  : "hover:bg-muted",
              )}
            >
              {tab.name}
            </button>
          ))}
          </div>

          <div className="flex items-center gap-5">
          <div className="border flex justify-center items-center gap-1 rounded-sm py-1 px-4">
            <VscListFilter />
            <span className="text-xs">Filter</span>
          </div>

          {/*
            THE PERIOD BELONGS TO THE EXPORT, not to the screen.

            It used to sit on its own next to Filter, which read as a filter on
            the figures -- and those cannot be filtered by date. The dashboard
            endpoint binds no date at all, so a period control over it would
            change nothing while looking like it had.

            GET /reports/export DOES take these presets, so attached to the
            button it is real. Joined into one control so the two are obviously
            a pair: this range, that download.
          */}
          <div className="flex items-center rounded-sm border">
            <CiCalendarDate className="ml-2 shrink-0" />
            <select
              value={exportPreset}
              onChange={(event) => setExportPreset(event.target.value)}
              aria-label="Period to export"
              className="cursor-pointer bg-transparent py-1 pl-1 pr-2 text-xs outline-none"
            >
              {DATE_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>

            <button className="cursor-pointer bg-blue-950 text-white rounded-r-sm py-1 px-4 flex justify-center items-center gap-2">
              <BsDownload size={14} />
              <span className=" text-[10px]">Export Data</span>
            </button>
          </div>
        </div>
        </div>

        

        {/* `min-h-0 flex-1` and not `h-full`: h-full would be the full 384px of
            the h-96 above, on top of the tab row, so the charts would hang out
            the bottom by the height of the tabs. */}
        <div className="flex min-h-0 flex-1 gap-2">
          <div className="w-[65%]">
            <ChartAreaDefault
              className="h-full"
              total={shownTotal}
              approved={shownApproved}
              description={shownDescription}
            />
          </div>

          <div className="w-[35%]">
            {activeRegion ? (
              // Scoped to the picked region, never to the tenant: these six add up
              // to the headline beside them -- NCR's to 310, not to 847.
              <ChartBarLabelCustom
                className="h-full"
                data={activeRegion.monthly}
              />
            ) : (
              <RegionsPanel
                regions={regions}
                total={total}
                onSelect={setSelected}
              />
            )}
          </div>
        </div>
      </div>

      {/* The only two things a Department Head can act on. Hidden at zero --
          an empty queue is not news. */}
      {pendingApprovals > 0 ||
      unassignedHeads > 0 ||
      unassignedOfficers > 0 ||
      stalled > 0 ? (
        <div className="flex flex-col gap-2">
          {unassignedHeads > 0 ? (
            <ActionRow
              Icon={LuUserPlus}
              to={paths.people}
              label={
                unassignedHeads === 1
                  ? "1 Regional Sales Head has no region yet"
                  : `${unassignedHeads} Regional Sales Heads have no region yet`
              }
              note="Until they do, their screens are empty and nothing says why."
            />
          ) : null}

          {pendingApprovals > 0 ? (
            <ActionRow
              Icon={LuUserCheck}
              to={paths.approvals}
              label={
                pendingApprovals === 1
                  ? "1 account is waiting for your approval"
                  : `${pendingApprovals} accounts are waiting for your approval`
              }
            />
          ) : null}

          {/* One tier further down than the DH acts on -- an Area Sales Head
              assigns branches, not them. It is here because the DH is the only
              one looking at the whole tenant: an Account Officer with no
              branches cannot create a referral and their screen never says so. */}
          {unassignedOfficers > 0 ? (
            <ActionRow
              Icon={LuUsers}
              to={paths.people}
              label={
                unassignedOfficers === 1
                  ? "1 Account Officer holds no branches"
                  : `${unassignedOfficers} Account Officers hold no branches`
              }
              note="They cannot create referrals until an Area Sales Head assigns them."
            />
          ) : null}

          {stalled > 0 ? (
            <ActionRow
              Icon={LuClock}
              to={paths.referrals}
              label={`${stalled} referrals have not moved in ${stalledDays} days`}
              note="Concentrated in Luzon. Worth asking its Regional Sales Head why."
            />
          ) : null}
        </div>
      ) : null}

      {notifications.length > 0 ? (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-medium">Latest activity</h2>

          <ul className="flex flex-col gap-1.5">
            {notifications.map((item) => (
              <li
                key={item.id}
                className="flex items-baseline justify-between gap-4 text-xs"
              >
                <span>{item.text}</span>
                {/* Relative, not absolute: on a feed the gap is the useful part,
                    and it stays readable without doing arithmetic. */}
                <span className="shrink-0 text-muted-foreground">
                  {formatRelative(item.at)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

    </div>
  );
}

/**
 * The three regions, side by side, in the slot the bar chart leaves empty when
 * the view is everything.
 *
 * Each row is a button: pressing it picks that region's tab, so this panel
 * doubles as the way INTO a region rather than only a readout of one. That is
 * why the whole row is the target and not just the name.
 *
 * The share bar is the point of the panel. Three numbers on their own are hard
 * to weigh against each other; the same three as proportions of the whole are
 * readable at a glance, which is the question a Department Head is actually
 * asking.
 */
/** Approved as a percentage of that region's own referrals. */
function rateOf(region) {
  if (!region.total || region.approved == null) return null;
  return Math.round((region.approved / region.total) * 100);
}

function RegionsPanel({ regions, total, onSelect }) {
  /*
    Ranked by conversion, NOT by volume, and that is the point of the panel.

    In volume order the biggest region is always on top and the worst performer
    sits at the bottom where nobody looks. Ranking by how much each region
    actually closes puts the one that needs attention where it will be seen --
    a small region closing well should outrank a large one that is not.

    `slice` first: `sort` mutates, and this array is a prop.
  */
  const ranked = [...regions].sort((a, b) => (rateOf(b) ?? 0) - (rateOf(a) ?? 0));

  return (
    <div className="flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex w-full items-center gap-3 rounded-sm">
        <MdOutlineLandscape
          size={25}
          color="white"
          className="rounded-full bg-[#0a90c8] p-1"
        />
        <span className="text-lg font-bold">Regions</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          by conversion
        </span>
      </div>

      {total === 0 ? (
        // Not three rows of zeroes. banc.Referrals starts empty, and a column
        // of zeroes reads as a broken query rather than as "nothing yet".
        <p className="flex min-h-0 flex-1 items-center rounded-sm border border-dashed border-border p-4 text-xs text-muted-foreground">
          No referrals have been recorded yet. Regional totals will appear here
          as branches and Account Officers start using the system.
        </p>
      ) : (
      /* min-h-0 so the list scrolls inside the card rather than stretching it,
         if a fourth region ever appears. */
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {ranked.map((region) => {
          // Guarded: `total` is 0 before any referral exists, and the panel
          // still has to render.
          const share = total > 0 ? Math.round((region.total / total) * 100) : 0;
          const rate = rateOf(region);

          return (
            <button
              key={region.code}
              type="button"
              onClick={() => onSelect(region.code)}
              className="w-full rounded-sm border border-border p-3 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[15px] font-bold text-neutral-500">
                  {region.name}
                </span>

                <span className="flex flex-col items-end leading-tight">
                  {/* Null is ordinary -- a region can sit without a head, and
                      that gap is worth reading rather than hiding. */}
                  <span className="text-xs font-bold">
                    {region.headName ?? "No Regional Sales Head"}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    {region.headUserCode ?? "Nobody assigned yet"}
                  </span>
                </span>
              </div>

              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold tabular-nums">
                  {region.total.toLocaleString()}
                </span>
                {/* Neutral, not green. A conversion rate is a standing, not a
                    change -- green would read as growth, and there is no trend
                    figure available anywhere. */}
                {rate != null ? (
                  <span className="rounded-lg bg-muted px-1.5 text-[10px] text-muted-foreground">
                    {rate}% converted
                  </span>
                ) : null}
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {share}% of PhilLife
                </span>
              </div>

              {/* The bar is the conversion rate, matching the order of the list.
                  Reading it as "how full" answers the same question the ranking
                  does, so the two cannot disagree. */}
              <div
                aria-hidden
                className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full rounded-full bg-[#0a90c8]"
                  style={{ width: `${rate ?? 0}%` }}
                />
              </div>

              {region.stalled > 0 ? (
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {region.stalled} not moved recently
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
      )}
    </div>
  );
}

function ActionRow({ Icon, to, label, note }) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
    >
      <Icon
        aria-hidden
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
      />

      <span className="flex flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        {note ? (
          <span className="text-xs text-muted-foreground">{note}</span>
        ) : null}
      </span>

      <LuArrowRight
        aria-hidden
        className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}
