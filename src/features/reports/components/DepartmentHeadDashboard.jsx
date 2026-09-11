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
import { LuArrowRight, LuUserCheck, LuUserPlus } from "react-icons/lu";
import { Link } from "react-router";

import { ChartAreaDefault } from "@/components/charts/ChartAreaDefault";
import { ChartBarLabelCustom } from "@/components/charts/ChartBarLabelCustom";
import { formatWeekdayDate } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import { CiCalendarDate } from "react-icons/ci";
import { IoIosArrowDown } from "react-icons/io";
import { VscListFilter } from "react-icons/vsc";
import { BsDownload } from "react-icons/bs";
import { MdOutlineLandscape } from "react-icons/md";

/** The "everything" tab. Not a region code, so it cannot collide with one. */
const ALL = "ALL";

export function DepartmentHeadDashboard({
  total,
  regions,
  pendingApprovals,
  unassignedHeads,
}) {
  const hasNothing = total === 0;

  // Which tab is picked -- ALL, or a region's code.
  const [selected, setSelected] = useState(ALL);

  // `find` rather than trusting `selected`: if the regions change under a
  // selection that no longer exists, this falls back to everything instead of
  // rendering a blank number.
  const activeRegion =
    regions.find((region) => region.code === selected) ?? null;

  const shownTotal = activeRegion ? activeRegion.total : total;

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

          <div className="flex gap-5">
          <div className="border flex justify-center items-center gap-1 rounded-sm py-1 px-3">
            <CiCalendarDate />
            <span className="text-xs">Last month</span>
            <IoIosArrowDown size={14} />
          </div>

          <div className="border flex justify-center items-center gap-1 rounded-sm py-1 px-4">
            <VscListFilter />
            <span className="text-xs">Filter</span>
          </div>

          <button className="cursor-pointer bg-blue-950 text-white border rounded-sm py-1 px-4 flex justify-center items-center gap-2">
            <BsDownload size={14} />
            <span className=" text-[10px]">Export Data</span>
          </button>
        </div>
        </div>

        

        {/* `min-h-0 flex-1` and not `h-full`: h-full would be the full 384px of
            the h-96 above, on top of the tab row, so the charts would hang out
            the bottom by the height of the tabs. */}
        <div className="flex min-h-0 flex-1 gap-2">
          <div className="w-[55%]">
            <ChartAreaDefault
              className="h-full"
              total={shownTotal}
              description={shownDescription}
            />
          </div>

          <div className="w-[45%]">
            {activeRegion ? (
              // Scoped to the picked region, never to the tenant: these six add up
              // to the headline beside them -- NCR's to 310, not to 847.
              <ChartBarLabelCustom
                className="h-full"
                data={activeRegion.monthly}
              />
            ) : (
              // You said this slot gets something other than a bar chart when the
              // view is everything. Placeholder until you decide what.
              <div className=" flex flex-col h-full items-center justify-center rounded-xl border border-dashed border-border text-center text-xs gap-3 p-2">

                <div className="rounded-sm flex justify-start items-center gap-3 w-full px-2">
                  <MdOutlineLandscape size={25} color="white" className="rounded-full p-1 bg-[#0a90c8]"/>
                  <span className="text-lg font-bold">Regions</span>
                </div>

                <div className="border rounded-sm w-full p-3 box-border flex flex-col justify-between items-center">

                  <div className="w-full box-border flex justify-between items-center">

                    <div className="flex justify-center items-center gap-2">
                  <span className="text-[15px] text-neutral-500 font-bold">NCR</span>
                  </div>

                  <div className="flex flex-col">
                    <span className="font-bold">Name of RSH</span>
                    <span className="text-neutral-500 text-[10px]">PHL-RSH-00001</span>
                  </div>
                  </div>

                  <div className=" w-full flex justify-start items-center gap-2">
                    <span className="text-xl font-bold">310</span>

                    <p className="flex justify-center items-center px-1 bg-green-300 rounded-lg text-[10px]">+8%</p>

                  </div>

                </div>

                <div className=" border rounded-sm w-full p-3 box-border flex flex-col justify-between items-center">

                  <div className="w-full box-border flex justify-between items-center">

                    <div className="flex justify-center items-center gap-2">
                  <span className="text-[15px] text-neutral-500 font-bold">Luzon</span>
                  </div>

                  <div className="flex flex-col">
                    <span className="font-bold">Name of RSH</span>
                    <span className="text-neutral-500 text-[10px]">PHL-RSH-00001</span>
                  </div>
                  </div>

                  <div className=" w-full flex justify-start items-center gap-2">
                    <span className="text-xl font-bold">310</span>

                    <p className="flex justify-center items-center px-1 bg-green-300 rounded-lg text-[10px]">+8%</p>

                  </div>

                </div>

                <div className=" border rounded-sm w-full p-3 box-border flex flex-col justify-between items-center">

                  <div className="w-full box-border flex justify-between items-center">

                    <div className="flex justify-center items-center gap-2">
                  <span className="text-[15px] text-neutral-500 font-bold">VisMin</span>
                  </div>

                  <div className="flex flex-col">
                    <span className="font-bold">Name of RSH</span>
                    <span className="text-neutral-500 text-[10px]">No RSH assigned</span>
                  </div>
                  </div>

                  <div className=" w-full flex justify-start items-center gap-2">
                    <span className="text-xl font-bold">242</span>

                    <p className="flex justify-center items-center px-1 bg-green-300 rounded-lg text-[10px]">+8%</p>

                  </div>

                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      {/* The only two things a Department Head can act on. Hidden at zero --
          an empty queue is not news. */}
      {pendingApprovals > 0 || unassignedHeads > 0 ? (
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
        </div>
      ) : null}

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
