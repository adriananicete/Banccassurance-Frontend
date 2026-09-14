/**
 * The Sector Head's dashboard: the Department Head's, for Landbank, ONE TIER
 * DOWN (Adrian, 2026-09-14). Landbank has no region head -- its tree is
 * Group (Group Head) -> Branch (Branch Head) -- so:
 *
 *   Department Head            Sector Head
 *   Regions card          ->   Groups card (in the regions shown)
 *   a region's Overview   ->   a group's Overview, with "← Groups" back
 *   Groups table          ->   Branches table, 10 per page
 *
 * The NCR / Luzon / VisMin buttons stay as a filter: groups and branches are
 * shared geography, and the summary honours parentRegionCode for a Landbank
 * caller (backend Q4).
 *
 * Presentational and CONTROLLED -- `pages/SectorHeadDashboardPage.jsx` owns
 * the period, the region and the group. The cards and table are shared with
 * the Department Head's dashboard (./DashboardParts.jsx).
 *
 * The props contract:
 *
 *   preset / onPresetChange
 *   regions / selectedRegion / onSelectRegion   The region buttons.
 *   groups       [{ code, name, parentName, total, approved, head... }] -- the
 *                groups in the regions shown, over the period.
 *   selectedGroup / onSelectGroup   A group code, or null for the Groups list.
 *   tenant       { total, approved } for all of Landbank over the period.
 *   monthly / sliderRange          The chart, for the tenant, region or group.
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
  RegionScope,
} from "./DashboardParts";

const TENANT = "Landbank";

export function SectorHeadDashboard({
  preset,
  onPresetChange,
  regions = [],
  selectedRegion,
  onSelectRegion,
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

  const activeRegion = regions.find((region) => region.code === selectedRegion) ?? null;
  const activeGroup = groups.find((group) => group.code === selectedGroup) ?? null;

  // Narrowest first: a picked group, else a picked region, else all of Landbank.
  const scope = activeGroup ?? activeRegion ?? { name: `All of ${TENANT}`, ...tenant };

  const regionTabs = (
    <RegionScope regions={regions} selected={selectedRegion} onSelect={onSelectRegion} />
  );

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-3">
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

        {regionTabs}
      </div>

      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[3fr_2fr]">
        <div className="h-[26rem] md:h-96">
          <ChartAreaGradient
            data={monthly}
            headline={scope.total}
            headlineLabel={`Total referrals · ${period}`}
            title="Referrals by month"
            description={`${scope.name} · ${period}`}
            sliderRange={sliderRange}
            empty="No referrals in this period."
            loading={chartLoading}
            error={chartError}
          />
        </div>

        {/* The groups in the regions shown, or once one is picked, that group's
            figures with a way back to the list. */}
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
              emptyText={
                activeRegion
                  ? `No groups with referrals or a Group Head in ${activeRegion.name} in this period.`
                  : "No referrals in this period. Group figures appear once branches refer."
              }
            />
          )}
        </div>
      </div>

      <PlacesTable
        // A new scope or period starts the pages again at 1.
        key={`${selectedRegion}-${selectedGroup ?? "all"}-${preset}`}
        title="Branches"
        description={`${scope.name} · ranked by approval · ${period}`}
        rows={branches}
        loading={branchesLoading}
        error={branchesError}
        placeLabel="Branch"
        headLabel="Branch Head"
        noHeadLabel="No Branch Head"
        showParent={!activeGroup}
        tabs={regionTabs}
        emptyText="No branches with referrals or a Branch Head here yet."
        pageSize={10}
      />
    </div>
  );
}
