import { useState } from 'react'

import { NotBuiltYet } from '@/app/NotBuiltYet'
import { DATE_PRESET } from '@/constants/presets'
import { ROLES } from '@/constants/roles'
import { useAuth } from '@/features/auth/AuthContext'
import { useRegions } from '@/features/lookups/hooks'
import { useHeadsByRole } from '@/features/users/hooks'
import { manilaToday } from '@/lib/datetime'

import { DepartmentHeadDashboard } from '../components/DepartmentHeadDashboard'
import { RegionalSalesHeadDashboardPage } from './RegionalSalesHeadDashboardPage'
import { SectorHeadDashboardPage } from './SectorHeadDashboardPage'
import {
  ALL_REGIONS,
  allTimeSliderRange,
  approvedFromByStatus,
  buildGroups,
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
 * One route, nine roles, and the screens are not the same screen.
 *
 * A Department Head reads regional output; an Account Officer works a queue of
 * their own referrals. Those are different questions, so this container picks
 * the component rather than one component branching nine ways internally.
 * Roles whose dashboard is not designed yet still get the scaffolding, so the
 * route never 404s and it stays obvious which ones are left.
 */
export function DashboardPage() {
  const { user } = useAuth()

  if (user?.role === ROLES.DEPARTMENT_HEAD) {
    return <DepartmentHeadDashboardPage />
  }

  if (user?.role === ROLES.SECTOR_HEAD) {
    return <SectorHeadDashboardPage />
  }

  if (user?.role === ROLES.REGIONAL_SALES_HEAD) {
    return <RegionalSalesHeadDashboardPage />
  }

  return (
    <NotBuiltYet
      title="Dashboard"
      note="The Department Head's, Sector Head's and Regional Sales Head's views are built and wired; the rest are not."
      endpoints={['GET /reports/dashboard', 'GET /reports/summary']}
    />
  )
}

/**
 * The Department Head's dashboard, wired to the API.
 *
 * The period and the region live HERE, not in the component, because each one
 * changes which requests are made. Everything else is shaped by
 * ../dashboardData.js and handed down.
 *
 * Requests, and why each exists:
 *   /lookups/regions                          the region list, so a region with no
 *                                             referrals still shows at zero
 *   /reports/dashboard                        the all-time total -- only on "All time"
 *   /reports/summary?groupBy=REGION           every region's figures for the period;
 *                                             their sum is the tenant for any other period
 *   /reports/summary?groupBy=MONTH            the chart, for the tenant or the picked region,
 *                                             over the period (All time is laid out
 *                                             January to December in dashboardData)
 *   /reports/summary?groupBy=AREA  x regions  the Groups table, one call per region in view
 *   /users?role=REGIONAL_SALES_HEAD / AREA_SALES_HEAD   names, codes and photos
 *
 * Custom is never requested: it is hidden until there is a date picker.
 *
 * Live data on 2026-09-14 is 106 referrals, all NCR, all September -- so Luzon
 * and VisMin read zero and the chart has one month. That is the data.
 */
function DepartmentHeadDashboardPage() {
  const [preset, setPreset] = useState(DATE_PRESET.ALL_TIME)
  const [selected, setSelected] = useState(ALL_REGIONS)
  const isAllTime = preset === DATE_PRESET.ALL_TIME
  const currentMonth = manilaToday().slice(0, 7)

  const regionsLookup = useRegions()
  const dashboard = useReportsDashboard({ enabled: isAllTime })
  const regionSummary = useReportSummary({ groupBy: 'REGION', preset })
  const regionalHeads = useHeadsByRole(ROLES.REGIONAL_SALES_HEAD)
  const areaHeads = useHeadsByRole(ROLES.AREA_SALES_HEAD)

  const regions = buildRegions(
    regionsLookup.data,
    regionSummary.data?.rows,
    regionalHeads.data,
  )

  // A selection that no longer names a region falls back to all of them.
  const activeCode = regions.some((region) => region.code === selected)
    ? selected
    : ALL_REGIONS
  const isAllRegions = activeCode === ALL_REGIONS

  const monthlySummary = useReportSummary({
    groupBy: 'MONTH',
    preset,
    parentRegionCode: isAllRegions ? undefined : activeCode,
  })

  const regionCodesInView = isAllRegions ? regions.map((region) => region.code) : [activeCode]
  const areaSummaries = useReportSummaries(
    regionCodesInView.map((code) => ({ groupBy: 'AREA', preset, parentRegionCode: code })),
  )

  const groups = buildGroups(
    areaSummaries.map((query, index) => ({
      regionCode: regionCodesInView[index],
      rows: query.data?.rows ?? [],
    })),
    areaHeads.data,
    regions,
  )

  // All time reads the API's own total; any other period is the sum of the
  // regions, because /summary has no total row.
  const tenant =
    isAllTime && dashboard.data
      ? { total: dashboard.data.total, approved: approvedFromByStatus(dashboard.data.byStatus) }
      : sumFigures(regionSummary.data?.rows)

  // Loading is the FIRST load only -- a query holding previous data is not
  // loading, it is refreshing in place.
  const pending = (query) => query.isPending && query.fetchStatus !== 'idle'
  const firstError = (...queries) => queries.find((query) => query.error)?.error ?? null

  const summaryQueries = [regionsLookup, regionSummary, regionalHeads, ...(isAllTime ? [dashboard] : [])]
  const summaryLoading = summaryQueries.some(pending)
  const summaryError = firstError(...summaryQueries)

  const groupQueries = [regionsLookup, areaHeads, ...areaSummaries]
  const groupsLoading = groupQueries.some(pending)
  const groupsError = firstError(...groupQueries)

  const exportReferrals = useExportReferrals()

  return (
    <DepartmentHeadDashboard
      preset={preset}
      onPresetChange={setPreset}
      selected={activeCode}
      onSelect={setSelected}
      tenant={tenant}
      regions={regions}
      monthly={chartMonths(preset, monthlySummary.data?.rows, currentMonth)}
      sliderRange={isAllTime ? allTimeSliderRange(currentMonth) : null}
      groups={groups}
      summaryLoading={summaryLoading}
      summaryError={summaryError}
      chartLoading={summaryLoading || pending(monthlySummary)}
      chartError={summaryError ?? monthlySummary.error ?? null}
      groupsLoading={groupsLoading}
      groupsError={groupsError}
      onExport={(exportPreset) => exportReferrals.mutate({ preset: exportPreset })}
      isExporting={exportReferrals.isPending}
      exportError={exportReferrals.error}
    />
  )
}
