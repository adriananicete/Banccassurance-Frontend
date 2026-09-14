import { useState } from 'react'

import { DATE_PRESET } from '@/constants/presets'
import { ROLES } from '@/constants/roles'
import { useRegions } from '@/features/lookups/hooks'
import { useHeadsByRole } from '@/features/users/hooks'
import { manilaToday } from '@/lib/datetime'

import { SectorHeadDashboard } from '../components/SectorHeadDashboard'
import {
  ALL_REGIONS,
  allTimeSliderRange,
  approvedFromByStatus,
  buildBranches,
  buildLandbankGroups,
  buildRegions,
  chartMonths,
  sumFigures,
} from '../dashboardData'
import {
  useExportReferrals,
  useReportsDashboard,
  useReportSummaries,
  useReportSummary,
} from '../hooks'

/**
 * The Sector Head's dashboard, wired to the API. Scoping is automatic: every
 * /reports call answers Landbank only for this session.
 *
 * The period, the region and the group live HERE, because each changes which
 * requests are made.
 *
 * Requests, and why each exists:
 *   /lookups/regions                         the region buttons, zero regions included
 *   /reports/dashboard                       the all-time total -- only on "All time"
 *   /reports/summary?groupBy=REGION          every region's figures; their sum is
 *                                            Landbank for any other period
 *   /reports/summary?groupBy=AREA x regions  the groups in the regions shown
 *   /reports/summary?groupBy=MONTH           the chart, for Landbank, a region or a group
 *   /reports/summary?groupBy=BRANCH x groups the branches in the groups shown
 *   /users?role=GROUP_HEAD / BRANCH_HEAD     names, codes and photos (backend R6)
 *
 * Absent rows are zero (backend F1): every list starts from a lookup or a
 * head's scope and fills figures in.
 *
 * Live data on 2026-09-14: 65 referrals, all NCR, CENTRAL NCR, September.
 */
export function SectorHeadDashboardPage() {
  const [preset, setPreset] = useState(DATE_PRESET.ALL_TIME)
  const [selectedRegion, setSelectedRegion] = useState(ALL_REGIONS)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const isAllTime = preset === DATE_PRESET.ALL_TIME
  const currentMonth = manilaToday().slice(0, 7)

  const regionsLookup = useRegions()
  const dashboard = useReportsDashboard({ enabled: isAllTime })
  const regionSummary = useReportSummary({ groupBy: 'REGION', preset })
  const groupHeads = useHeadsByRole(ROLES.GROUP_HEAD)
  const branchHeads = useHeadsByRole(ROLES.BRANCH_HEAD)

  // No region heads on Landbank, so no heads are passed for regions.
  const regions = buildRegions(regionsLookup.data, regionSummary.data?.rows, [])
  const activeRegionCode = regions.some((region) => region.code === selectedRegion)
    ? selectedRegion
    : ALL_REGIONS
  const isAllRegions = activeRegionCode === ALL_REGIONS

  const regionCodesInView = isAllRegions ? regions.map((region) => region.code) : [activeRegionCode]
  const areaSummaries = useReportSummaries(
    regionCodesInView.map((code) => ({ groupBy: 'AREA', preset, parentRegionCode: code })),
  )
  const groups = buildLandbankGroups(
    areaSummaries.map((query, index) => ({
      regionCode: regionCodesInView[index],
      rows: query.data?.rows ?? [],
    })),
    groupHeads.data,
    regions,
  )

  // A picked group that is no longer in view falls back to the Groups list.
  const activeGroup = groups.find((group) => group.code === selectedGroup) ?? null

  const monthlySummary = useReportSummary({
    groupBy: 'MONTH',
    preset,
    // One parent at most -- both at once is a 400.
    parentGroupCode: activeGroup ? activeGroup.code : undefined,
    parentRegionCode: !activeGroup && !isAllRegions ? activeRegionCode : undefined,
  })

  const groupCodesInView = activeGroup ? [activeGroup.code] : groups.map((group) => group.code)
  const branchSummaries = useReportSummaries(
    groupCodesInView.map((code) => ({ groupBy: 'BRANCH', preset, parentGroupCode: code })),
  )
  const branches = buildBranches(
    branchSummaries.map((query, index) => ({
      groupCode: groupCodesInView[index],
      rows: query.data?.rows ?? [],
    })),
    branchHeads.data,
    groups,
  )

  const tenant =
    isAllTime && dashboard.data
      ? { total: dashboard.data.total, approved: approvedFromByStatus(dashboard.data.byStatus) }
      : sumFigures(regionSummary.data?.rows)

  // Loading is the FIRST load only; a query holding previous data refreshes in place.
  const pending = (query) => query.isPending && query.fetchStatus !== 'idle'
  const firstError = (...queries) => queries.find((query) => query.error)?.error ?? null

  const summaryQueries = [regionsLookup, regionSummary, ...(isAllTime ? [dashboard] : [])]
  const groupQueries = [regionsLookup, groupHeads, ...areaSummaries]
  const branchQueries = [...groupQueries, branchHeads, ...branchSummaries]

  const exportReferrals = useExportReferrals()

  const selectRegion = (code) => {
    setSelectedRegion(code)
    // A new region shows its groups, not a group from the old one.
    setSelectedGroup(null)
  }

  return (
    <SectorHeadDashboard
      preset={preset}
      onPresetChange={setPreset}
      regions={regions}
      selectedRegion={activeRegionCode}
      onSelectRegion={selectRegion}
      groups={groups}
      selectedGroup={activeGroup ? activeGroup.code : null}
      onSelectGroup={setSelectedGroup}
      tenant={tenant}
      monthly={chartMonths(preset, monthlySummary.data?.rows, currentMonth)}
      sliderRange={isAllTime ? allTimeSliderRange(currentMonth) : null}
      branches={branches}
      summaryLoading={summaryQueries.some(pending)}
      summaryError={firstError(...summaryQueries)}
      groupsLoading={groupQueries.some(pending)}
      groupsError={firstError(...groupQueries)}
      chartLoading={summaryQueries.some(pending) || pending(monthlySummary)}
      chartError={firstError(...summaryQueries) ?? monthlySummary.error ?? null}
      branchesLoading={branchQueries.some(pending)}
      branchesError={firstError(...branchQueries)}
      onExport={(exportPreset) => exportReferrals.mutate({ preset: exportPreset })}
      isExporting={exportReferrals.isPending}
      exportError={exportReferrals.error}
    />
  )
}
