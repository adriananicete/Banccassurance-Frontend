import { useState } from 'react'

import { DATE_PRESET } from '@/constants/presets'
import { ROLES } from '@/constants/roles'
import { useBranchesForGroups, useGroups } from '@/features/lookups/hooks'
import { useHeadsByRole } from '@/features/users/hooks'
import { manilaToday } from '@/lib/datetime'

import { SectorHeadDashboard } from '../components/SectorHeadDashboard'
import {
  allTimeSliderRange,
  approvedFromByStatus,
  buildBranches,
  buildLandbankGroups,
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
 * No region buttons (Adrian, 2026-09-14) -- the Groups card is the control. So
 * the period and the picked group live HERE, because each changes which
 * requests are made.
 *
 * Requests, and why each exists:
 *   /lookups/groups                          EVERY group, so an empty one shows at 0
 *   /lookups/branches?groupCode= x groups    EVERY branch of the groups shown, at 0 if empty
 *   /reports/dashboard                       the all-time total -- only on "All time"
 *   /reports/summary?groupBy=AREA            every group's figures; their sum is
 *                                            Landbank for any other period
 *   /reports/summary?groupBy=MONTH           the chart, for Landbank or the picked group
 *   /reports/summary?groupBy=BRANCH x groups figures for the branches -- only for groups
 *                                            that have branches
 *   /users?role=GROUP_HEAD / BRANCH_HEAD     names, codes and photos (backend R6)
 *
 * Absent rows are zero (backend F1): groups and branches come from the lookups.
 * Every Landbank referral carries a group and a branch, so the group rows add up
 * to Landbank (F3).
 *
 * Live data on 2026-09-14: 65 referrals, all CENTRAL NCR, September.
 */
export function SectorHeadDashboardPage() {
  const [preset, setPreset] = useState(DATE_PRESET.ALL_TIME)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const isAllTime = preset === DATE_PRESET.ALL_TIME
  const currentMonth = manilaToday().slice(0, 7)

  const groupsLookup = useGroups()
  const dashboard = useReportsDashboard({ enabled: isAllTime })
  const areaSummary = useReportSummary({ groupBy: 'AREA', preset })
  const groupHeads = useHeadsByRole(ROLES.GROUP_HEAD)
  const branchHeads = useHeadsByRole(ROLES.BRANCH_HEAD)

  const groups = buildLandbankGroups({
    lookupGroups: groupsLookup.data,
    // One call for every group; no region is needed without region buttons.
    areaResults: [{ regionCode: null, rows: areaSummary.data?.rows ?? [] }],
    groupHeads: groupHeads.data,
  })

  // A picked group that is no longer in the list falls back to the Groups card.
  const activeGroup = groups.find((group) => group.code === selectedGroup) ?? null

  const monthlySummary = useReportSummary({
    groupBy: 'MONTH',
    preset,
    parentGroupCode: activeGroup ? activeGroup.code : undefined,
  })

  const groupCodesInView = activeGroup ? [activeGroup.code] : groups.map((group) => group.code)
  const branchLookups = useBranchesForGroups(groupCodesInView)

  // Figures only where there are branches to have them -- twelve of the fifteen
  // groups hold none yet, and asking would be twelve empty calls.
  const groupsWithBranches = groupCodesInView.filter(
    (code, index) => (branchLookups[index].data?.length ?? 0) > 0,
  )
  const branchSummaries = useReportSummaries(
    groupsWithBranches.map((code) => ({ groupBy: 'BRANCH', preset, parentGroupCode: code })),
  )

  const branches = buildBranches({
    branchLookups: groupCodesInView.map((code, index) => ({
      groupCode: code,
      branches: branchLookups[index].data ?? [],
    })),
    branchResults: branchSummaries.map((query, index) => ({
      groupCode: groupsWithBranches[index],
      rows: query.data?.rows ?? [],
    })),
    branchHeads: branchHeads.data,
    groups,
  })

  const tenant =
    isAllTime && dashboard.data
      ? { total: dashboard.data.total, approved: approvedFromByStatus(dashboard.data.byStatus) }
      : sumFigures(areaSummary.data?.rows)

  // Loading is the FIRST load only; a query holding previous data refreshes in place.
  const pending = (query) => query.isPending && query.fetchStatus !== 'idle'
  const firstError = (...queries) => queries.find((query) => query.error)?.error ?? null

  const summaryQueries = [areaSummary, ...(isAllTime ? [dashboard] : [])]
  const groupQueries = [groupsLookup, groupHeads, areaSummary]
  const branchQueries = [...groupQueries, branchHeads, ...branchLookups, ...branchSummaries]

  const exportReferrals = useExportReferrals()

  return (
    <SectorHeadDashboard
      preset={preset}
      onPresetChange={setPreset}
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