import { useState } from 'react'

import { DATE_PRESET } from '@/constants/presets'
import { ROLES } from '@/constants/roles'
import { useAuth } from '@/features/auth/AuthContext'
import { useGroups, useRegions } from '@/features/lookups/hooks'
import { APPROVAL_ACTION, APPROVAL_STATUS, notifyApproval, placeOf } from '@/features/users/approvalsUtils'
import { ConfirmApprovalDialog } from '@/features/users/components/ConfirmApprovalDialog'
import { NeedsGroupsCard } from '@/features/users/components/NeedsGroupsCard'
import { PendingApprovalsCard } from '@/features/users/components/PendingApprovalsCard'
import {
  useApprovalAction,
  useApprovalCounts,
  useHeadsByRole,
  usePendingApprovals,
} from '@/features/users/hooks'
import { manilaToday } from '@/lib/datetime'
import { paths } from '@/routes/paths'

import { RegionalSalesHeadDashboard } from '../components/RegionalSalesHeadDashboard'
import {
  allTimeSliderRange,
  approvedFromByStatus,
  buildAccountOfficers,
  buildRegionGroups,
  chartMonths,
  sumFigures,
} from '../dashboardData'
import {
  useExportReferrals,
  useReportSummaries,
  useReportSummary,
  useReportsDashboard,
} from '../hooks'

/**
 * The Regional Sales Head's dashboard, wired. Every /reports call is scoped to
 * the RSH's groups by the session.
 *
 * Requests, and why each exists:
 *   /users/approvals?status=PENDING&pageSize=5   Awaiting your approval (+ counts for the pill)
 *   /users?role=AREA_SALES_HEAD                   Need groups, and each group's head (R10)
 *   /lookups/groups, /lookups/regions             names for "Registered under" on the pending card
 *   /reports/dashboard                            the all-time headline, on All time only
 *   /reports/summary?groupBy=AREA                 every group's figures; their sum is the region
 *   /reports/summary?groupBy=MONTH                the chart, for the region or the picked group
 *   /reports/summary?groupBy=AO x groups          the Account Officers table, one call per group in view
 */
export function RegionalSalesHeadDashboardPage() {
  const { user } = useAuth()
  const [preset, setPreset] = useState(DATE_PRESET.ALL_TIME)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [target, setTarget] = useState(null)
  const isAllTime = preset === DATE_PRESET.ALL_TIME
  const currentMonth = manilaToday().slice(0, 7)

  const groupScopes = (user?.scopes ?? []).filter((scope) => scope.level === 'GROUP')
  const regionName = groupScopes[0]?.regionName ?? 'your region'

  // ── Your work ──────────────────────────────────────────────────────────
  const pending = usePendingApprovals(5)
  const { counts } = useApprovalCounts()
  const areaHeads = useHeadsByRole(ROLES.AREA_SALES_HEAD)
  const approvalAction = useApprovalAction()
  const lookupGroups = useGroups()
  const lookupRegions = useRegions()
  const lookups = { groups: lookupGroups.data ?? [], regions: lookupRegions.data ?? [] }

  const needGroups = (areaHeads.data ?? []).filter(
    (head) => head.approved && (head.scope ?? []).length === 0,
  )

  // A "Your work" card shows only once its list has come back with something
  // in it -- or failed, so a failure is not silently hidden. Loading and empty
  // both render nothing (Adrian: an empty card should not take the space).
  const pendingRows = pending.data?.rows ?? []
  const showApproval = Boolean(pending.error) || pendingRows.length > 0
  const showNeedGroups = Boolean(areaHeads.error) || (areaHeads.isSuccess && needGroups.length > 0)

  // ── Performance ────────────────────────────────────────────────────────
  const dashboard = useReportsDashboard({ enabled: isAllTime })
  const areaSummary = useReportSummary({ groupBy: 'AREA', preset })

  const groups = buildRegionGroups({
    scopes: groupScopes,
    areaRows: areaSummary.data?.rows ?? [],
    areaHeads: areaHeads.data ?? [],
  })
  const activeGroup = groups.find((group) => group.code === selectedGroup) ?? null

  const monthlySummary = useReportSummary({
    groupBy: 'MONTH',
    preset,
    parentGroupCode: activeGroup ? activeGroup.code : undefined,
  })

  const groupCodesInView = activeGroup ? [activeGroup.code] : groups.map((group) => group.code)
  const officerSummaries = useReportSummaries(
    groupCodesInView.map((code) => ({ groupBy: 'AO', preset, parentGroupCode: code })),
  )
  const officers = buildAccountOfficers({
    results: officerSummaries.map((query, index) => ({
      groupCode: groupCodesInView[index],
      rows: query.data?.rows ?? [],
    })),
    groups,
  })

  const region =
    isAllTime && dashboard.data
      ? { total: dashboard.data.total, approved: approvedFromByStatus(dashboard.data.byStatus) }
      : sumFigures(areaSummary.data?.rows)

  const isPending = (query) => query.isPending && query.fetchStatus !== 'idle'
  const firstError = (...queries) => queries.find((query) => query.error)?.error ?? null

  const summaryQueries = [areaSummary, areaHeads, ...(isAllTime ? [dashboard] : [])]
  const officerQueries = [areaSummary, ...officerSummaries]

  const exportReferrals = useExportReferrals()

  // Handlers read `target` with `?.` -- the React Compiler reads a closure's
  // values during render, and `target` is null most of the time.
  const closeDialog = () => {
    setTarget(null)
    approvalAction.reset()
  }
  const confirmApproval = () => {
    if (!target) return
    const row = target?.row
    approvalAction.mutate(
      { userId: row?.userId, action: target?.action },
      {
        onSuccess: () => {
          notifyApproval(target?.action, row?.fullName ?? row?.userCode)
          closeDialog()
        },
      },
    )
  }

  return (
    <>
      <RegionalSalesHeadDashboard
        regionName={regionName}
        preset={preset}
        onPresetChange={setPreset}
        groups={groups}
        selectedGroup={activeGroup ? activeGroup.code : null}
        onSelectGroup={setSelectedGroup}
        region={region}
        monthly={chartMonths(preset, monthlySummary.data?.rows, currentMonth)}
        sliderRange={isAllTime ? allTimeSliderRange(currentMonth) : null}
        officers={officers}
        workApproval={
          showApproval ? (
          <PendingApprovalsCard
            rows={pendingRows.map((row) => ({ ...row, place: placeOf(row, lookups) }))}
            count={counts[APPROVAL_STATUS.PENDING]}
            loading={isPending(pending)}
            error={pending.error}
            onApprove={(row) => setTarget({ row, action: APPROVAL_ACTION.APPROVE })}
          />
          ) : null
        }
        workGroups={
          showNeedGroups ? (
            <NeedsGroupsCard
              people={needGroups}
              loading={false}
              error={areaHeads.error}
              assignTo={paths.people}
            />
          ) : null
        }
        summaryLoading={summaryQueries.some(isPending)}
        summaryError={firstError(...summaryQueries)}
        chartLoading={summaryQueries.some(isPending) || isPending(monthlySummary)}
        chartError={firstError(...summaryQueries) ?? monthlySummary.error ?? null}
        officersLoading={officerQueries.some(isPending)}
        officersError={firstError(...officerQueries)}
        onExport={(exportPreset) => exportReferrals.mutate({ preset: exportPreset })}
        isExporting={exportReferrals.isPending}
        exportError={exportReferrals.error}
      />
      <ConfirmApprovalDialog
        target={target}
        submitting={approvalAction.isPending}
        error={approvalAction.error}
        onConfirm={confirmApproval}
        onClose={closeDialog}
      />
    </>
  )
}
