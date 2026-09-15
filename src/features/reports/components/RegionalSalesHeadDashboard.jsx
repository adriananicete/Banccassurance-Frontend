/**
 * The Regional Sales Head's dashboard (Adrian, 2026-09-15 -- "Work +
 * performance"). Not the Sector Head's layout: an RSH oversees ONE PhilLife
 * region -- its groups, each run by an Area Sales Head, and the Account
 * Officers under them -- and also approves area heads and gives them groups.
 * So the screen is their work first, then how the region is doing:
 *
 *   1. Your work       Awaiting your approval · Need groups   (the page hands both in)
 *   2. Chart + Groups  the region, or a picked group; the Groups card stays on
 *                      screen and is the filter, like the Sector Head's
 *   3. Account Officers who is working the referrals, under the groups in view
 *
 * Presentational and CONTROLLED -- `pages/RegionalSalesHeadDashboardPage.jsx`
 * owns the period, the picked group and every request.
 *
 *   regionName        "NCR" -- the RSH's region, for the title and Export.
 *   preset / onPresetChange
 *   groups / selectedGroup / onSelectGroup   A group code, or null for the region.
 *   region            { total, approved } for the whole region over the period.
 *   monthly / sliderRange
 *   officers          [{ code, name, parentName, total, approved }]
 *   workApproval / workGroups   The two "Your work" cards.
 *   summaryLoading / summaryError · chartLoading / chartError · officersLoading / officersError
 *   onExport / isExporting / exportError
 */
import { ChartAreaGradient } from "@/components/charts/ChartAreaGradient";

import { ALL_REGIONS } from "../dashboardData";
import { presetLabel } from "../dashboardFormat";
import { DashboardTitle, ExportControl, PlacesCard, PlacesTable } from "./DashboardParts";

export function RegionalSalesHeadDashboard({
  regionName,
  preset,
  onPresetChange,
  groups = [],
  selectedGroup,
  onSelectGroup,
  region = { total: null, approved: null },
  monthly = [],
  sliderRange = null,
  officers = [],
  workApproval,
  workGroups,
  summaryLoading = false,
  summaryError = null,
  chartLoading = false,
  chartError = null,
  officersLoading = false,
  officersError = null,
  onExport,
  isExporting = false,
  exportError = null,
}) {
  const period = presetLabel(preset);
  const activeGroup = groups.find((group) => group.code === selectedGroup) ?? null;
  const scope = activeGroup ?? { name: `All of ${regionName}`, ...region };

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <DashboardTitle subtitle={`Where ${regionName} stands, and which Area Sales Head needs you`} />
        <ExportControl
          preset={preset}
          onPresetChange={onPresetChange}
          onExport={onExport}
          isExporting={isExporting}
          exportError={exportError}
          scopeName={regionName}
        />
      </div>

      {/* 1. Your work -- what only the RSH can move. */}
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2">
        {workApproval}
        {workGroups}
      </div>

      {/* 2. The region, or a picked group. */}
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[3fr_2fr]">
        <div className="h-[26rem] md:h-96">
          <ChartAreaGradient
            data={monthly}
            headline={scope.total}
            headlineApproved={scope.approved}
            headlineLabel={`Total referrals · ${period}`}
            approvedLabel={period}
            title="Referrals by month"
            description={`${scope.name} · ${period}`}
            sliderRange={sliderRange}
            empty="No referrals in this period."
            loading={chartLoading}
            error={chartError}
          />
        </div>

        {/* Stays on screen: it is the filter for the chart and the table.
            Pressing the picked group again goes back to the whole region. */}
        <div className="lg:h-96">
          <PlacesCard
            title="Groups"
            items={groups}
            total={region.total}
            period={period}
            selected={selectedGroup ?? ALL_REGIONS}
            onSelect={(code) => onSelectGroup(code === ALL_REGIONS ? null : code)}
            toggle
            loading={summaryLoading}
            error={summaryError}
            tenantName={regionName}
            noHeadLabel="No Area Sales Head"
            emptyText="You hold no groups yet. Your Department Head assigns your region."
          />
        </div>
      </div>

      {/* 3. Who is working them. */}
      <PlacesTable
        // A new scope or period starts the pages again at 1.
        key={`${selectedGroup ?? "all"}-${preset}`}
        title="Account Officers"
        description={`${scope.name} · ranked by approval · ${period}`}
        rows={officers}
        loading={officersLoading}
        error={officersError}
        placeLabel="Account Officer"
        showParent={!activeGroup}
        emptyText={
          activeGroup
            ? `No Account Officer in ${activeGroup.name} has referrals in this period.`
            : "No Account Officer has referrals in this period."
        }
        pageSize={10}
      />
    </div>
  );
}
