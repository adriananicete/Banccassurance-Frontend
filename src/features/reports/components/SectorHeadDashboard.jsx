/**
 * The Sector Head's dashboard: the Department Head's, for Landbank, ONE TIER
 * DOWN (Adrian, 2026-09-14). Landbank has no region head -- its tree is
 * Group (Group Head) -> Branch (Branch Head) -- so:
 *
 *   Department Head            Sector Head
 *   Region buttons        ->   none -- the Groups card is the control (Adrian)
 *   Regions card          ->   Groups card, every group
 *   a region's Overview   ->   a group's Overview, with "← Groups" back
 *   Groups table          ->   Branches table, 10 per page
 *
 * No NCR / Luzon / VisMin buttons (Adrian, 2026-09-14): picking a group in the
 * card narrows the chart, the Overview and the Branches table, which is all a
 * Sector Head needs, and Landbank has no one heading a region.
 *
 * Presentational and CONTROLLED -- `pages/SectorHeadDashboardPage.jsx` owns
 * the period and the group. The cards and table are shared with
 * the Department Head's dashboard (./DashboardParts.jsx).
 *
 * The props contract:
 *
 *   preset / onPresetChange
 *   groups       [{ code, name, total, approved, head... }] -- every group,
 *                over the period, zero included.
 *   selectedGroup / onSelectGroup   A group code, or null for the Groups list.
 *   tenant       { total, approved } for all of Landbank over the period.
 *   monthly / sliderRange          The chart, for Landbank or the picked group.
 *   branches     [{ code, name, parentName, total, approved, head... }] -- the
 *                branches in view.
 *   summaryLoading / summaryError   The headline.
 *   groupsLoading / groupsError     The Groups card and a group's Overview.
 *   chartLoading / chartError
 *   branchesLoading / branchesError
 *   onExport / isExporting / exportError
 */
import { ChartAreaGradient } from "@/components/charts/ChartAreaGradient";

import { presetLabel, shareOf } from "../dashboardFormat";
import {
  DashboardTitle,
  ExportControl,
  OverviewCard,
  PlacesCard,
  PlacesTable,
} from "./DashboardParts";

const TENANT = "Landbank";

export function SectorHeadDashboard({
  preset,
  onPresetChange,
  groups = [],
  selectedGroup,
  onSelectGroup,
  tenant = { total: null, approved: null },
  monthly = [],
  sliderRange = null,
  branches = [],
  summaryLoading = false,
  summaryError = null,
  groupsLoading = false,
  groupsError = null,
  chartLoading = false,
  chartError = null,
  branchesLoading = false,
  branchesError = null,
  onExport,
  isExporting = false,
  exportError = null,
}) {
  const period = presetLabel(preset);

  const activeGroup = groups.find((group) => group.code === selectedGroup) ?? null;

  // A picked group, else all of Landbank.
  const scope = activeGroup ?? { name: `All of ${TENANT}`, ...tenant };

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <DashboardTitle subtitle={`Where ${TENANT} stands, and which group is behind`} />
        <ExportControl
          preset={preset}
          onPresetChange={onPresetChange}
          onExport={onExport}
          isExporting={isExporting}
          exportError={exportError}
          scopeName={TENANT}
        />
      </div>

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

        {/* Every group, or once one is picked, that group's figures with a way
            back to the list. */}
        <div className="lg:h-96">
          {activeGroup ? (
            <OverviewCard
              scope={activeGroup}
              share={shareOf(activeGroup.total, tenant.total)}
              period={period}
              loading={groupsLoading}
              error={groupsError}
              tenantName={TENANT}
              headRoleLabel="Group Head"
              onBack={() => onSelectGroup(null)}
              backLabel="Groups"
            />
          ) : (
            <PlacesCard
              title="Groups"
              items={groups}
              total={tenant.total}
              period={period}
              selected={selectedGroup}
              onSelect={onSelectGroup}
              loading={summaryLoading || groupsLoading}
              error={summaryError ?? groupsError}
              tenantName={TENANT}
              noHeadLabel="No Group Head assigned"
              emptyText="No groups to show."
            />
          )}
        </div>
      </div>

      <PlacesTable
        // A new scope or period starts the pages again at 1.
        key={`${selectedGroup ?? "all"}-${preset}`}
        title="Branches"
        description={`${scope.name} · ranked by approval · ${period}`}
        rows={branches}
        loading={branchesLoading}
        error={branchesError}
        placeLabel="Branch"
        headLabel="Branch Head"
        noHeadLabel="No Branch Head"
        showParent={!activeGroup}
        emptyText={activeGroup ? `${activeGroup.name} has no branches yet.` : "No branches here yet."}
        pageSize={10}
      />
    </div>
  );
}
