/**
 * The Department Head's dashboard, built on context/FRONTEND_DESIGN_PATTERN.md.
 * Header, the region choice, then the chart with a side panel beside it --
 * Regions while every region is showing, that region's Overview once one is
 * picked -- and below them a table of the groups under the regions.
 *
 * Presentational and CONTROLLED. `pages/DashboardPage.jsx` owns the period and
 * the region, because both change which requests are made, and hands down
 * figures already shaped for the period by `../dashboardData.js`. Nothing here
 * computes a period. The cards and table are shared with the Sector Head's
 * dashboard -- see ./DashboardParts.jsx.
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
 *                included. Head fields MAY BE NULL.
 *   monthly      [{ month: "2026-09", referrals, approved }] for the tenant or
 *                the picked region, over the period. All time is January to
 *                December of this year; months after now have null values.
 *   sliderRange  { startIndex, endIndex } on All time -- the chart shows a
 *                slider under the axis, opening on that range. Null otherwise.
 *   groups       [{ code, name, parentName, total, approved, headName,
 *                headUserCode, headAvatarSrc }] -- the groups in view.
 *   summaryLoading / summaryError   Headline, Regions and Overview.
 *   chartLoading / chartError       The chart.
 *   groupsLoading / groupsError     The Groups table.
 *   onExport(preset) / isExporting / exportError
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

const TENANT = "PhilLife";

export function DepartmentHeadDashboard({
  preset,
  onPresetChange,
  selected,
  onSelect,
  tenant = { total: null, approved: null },
  regions = [],
  monthly = [],
  sliderRange = null,
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
  const scope = activeRegion ?? { name: `All of ${TENANT}`, ...tenant };

  return (
    // DOM order is the phone order: header, region choice, chart, the side
    // panel, then the groups table. From lg the chart and the side panel share a
    // row, three fifths to two fifths.
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <DashboardTitle subtitle={`Where ${TENANT} stands, and which region is behind`} />
          <ExportControl
            preset={preset}
            onPresetChange={onPresetChange}
            onExport={onExport}
            isExporting={isExporting}
            exportError={exportError}
            scopeName={TENANT}
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

        {/* The slot beside the chart: the way INTO a region, or once one is
            picked, that region's figures. */}
        <div className="lg:h-96">
          {activeRegion ? (
            <OverviewCard
              scope={scope}
              share={shareOf(activeRegion.total, tenant.total)}
              period={period}
              loading={summaryLoading}
              error={summaryError}
              tenantName={TENANT}
              headRoleLabel="Regional Sales Head"
            />
          ) : (
            <PlacesCard
              title="Regions"
              items={regions}
              total={tenant.total}
              period={period}
              selected={selected}
              onSelect={onSelect}
              toggle
              loading={summaryLoading}
              error={summaryError}
              tenantName={TENANT}
              noHeadLabel="No Regional Sales Head assigned"
              emptyText="No referrals in this period. Regional figures appear once branches refer."
            />
          )}
        </div>
      </div>

      <PlacesTable
        title="Groups"
        description={`${scope.name} · ranked by approval · ${period}`}
        rows={groups}
        loading={groupsLoading}
        error={groupsError}
        placeLabel="Group"
        headLabel="Area Sales Head"
        noHeadLabel="No Area Sales Head"
        showParent={!activeRegion}
        tabs={<RegionScope regions={regions} selected={selected} onSelect={onSelect} />}
        emptyText="No groups with referrals or an Area Sales Head in this region yet."
      />
    </div>
  );
}
