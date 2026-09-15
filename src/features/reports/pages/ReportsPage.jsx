import { useState } from 'react'

import { NotBuiltYet } from '@/app/NotBuiltYet'
import { ROLES } from '@/constants/roles'
import { STATUS, countForStatus, sumStatusCounts } from '@/constants/status'
import { useAuth } from '@/features/auth/AuthContext'
import { useReferrals } from '@/features/referrals/hooks'

import { ExportReports } from '../components/ExportReports'
import { RANGE, customRangeProblem, datesFor, periodParams } from '../exportRange'
import { useExportReferrals, useReportSummary } from '../hooks'

/**
 * /reports -- the export page (Adrian, 2026-09-15). The status drill-down that
 * lived here moved to /referrals.
 *
 * Built for the tenant heads; every other role keeps the scaffold.
 */
export function ReportsPage() {
  const { user } = useAuth()

  if (user?.role === ROLES.DEPARTMENT_HEAD) {
    return <TenantExport tenantName="PhilLife" groupBy="REGION" placeLabel="region" />
  }
  if (user?.role === ROLES.SECTOR_HEAD) {
    return <TenantExport tenantName="Landbank" groupBy="AREA" placeLabel="group" />
  }
  if (user?.role === ROLES.REGIONAL_SALES_HEAD) {
    // Scoped to their region's groups by the session; "Top group" among them.
    const region = (user?.scopes ?? []).find((scope) => scope.level === 'GROUP')?.regionName
    return <TenantExport tenantName={region ?? 'your region'} groupBy="AREA" placeLabel="group" />
  }

  return (
    <NotBuiltYet
      title="Reports"
      note="Built for the Department Head, Sector Head and Regional Sales Head; the other roles are not yet."
      endpoints={['GET /reports/summary', 'GET /reports/export', 'GET /referrals']}
    />
  )
}

/**
 * The range, the status and the Preview page live here because each changes a
 * request. Three requests follow them:
 *
 *   /reports/summary?groupBy=REGION|AREA   the Report Summary tiles -- the eight
 *                                          status columns summed, and the top place
 *   /referrals?status=&dateFrom=&dateTo=   the Preview, and the count on Export --
 *                                          the same rows the file will hold (F10)
 *   /reports/export                        the file, on the button
 *
 * A Custom range with a missing or backwards date holds all three.
 */
function TenantExport({ tenantName, groupBy, placeLabel }) {
  const [range, setRange] = useState(RANGE.THIS_MONTH)
  const [custom, setCustom] = useState({ dateFrom: null, dateTo: null })
  const [status, setStatus] = useState(null)

  const dates = datesFor(range, custom)
  const rangeProblem = range === RANGE.CUSTOM ? customRangeProblem(dates) : null
  const period = periodParams(range, dates)

  const summaryQuery = useReportSummary({ groupBy, ...period }, { enabled: !rangeProblem })
  const preview = useReferrals(
    { status, dateFrom: dates.dateFrom, dateTo: dates.dateTo },
    { enabled: !rangeProblem },
  )
  const exportReferrals = useExportReferrals()

  // Custom starts from the dates on screen, so switching to it never blanks them.
  const changeRange = (next) => {
    if (next === RANGE.CUSTOM && range !== RANGE.CUSTOM) setCustom(datesFor(range))
    setRange(next)
  }

  const summary = summarise(summaryQuery.data?.rows ?? [], status)
  const pending = (query) => query.isPending && query.fetchStatus !== 'idle'

  return (
    <ExportReports
      tenantName={tenantName}
      range={range}
      onRangeChange={changeRange}
      dates={dates}
      onCustomDateChange={(field, value) => setCustom((current) => ({ ...current, [field]: value || null }))}
      rangeProblem={rangeProblem}
      status={status}
      onStatusChange={setStatus}
      summary={summary}
      placeLabel={placeLabel}
      summaryLoading={pending(summaryQuery)}
      summaryError={summaryQuery.error}
      rows={preview.rows}
      loading={pending(preview)}
      error={preview.error}
      page={preview.page}
      totalPages={preview.totalPages}
      totalCount={preview.totalCount}
      pageSize={preview.pageSize}
      onPageChange={preview.setPage}
      onExport={() => exportReferrals.mutate({ ...period, status })}
      isExporting={exportReferrals.isPending}
      exportError={exportReferrals.error}
    />
  )
}

/**
 * The Report Summary figures from summary rows (one per region or group).
 * A summary row has no total column -- the eight statuses are summed, and read
 * through constants/status.js, never `row[status]`.
 */
function summarise(rows, status) {
  if (rows.length === 0) {
    return { referrals: 0, share: null, approved: 0, topName: null, topCount: 0 }
  }

  const countOf = (row) => (status ? countForStatus(row, status) : sumStatusCounts(row))
  const all = rows.reduce((sum, row) => sum + sumStatusCounts(row), 0)
  const referrals = rows.reduce((sum, row) => sum + countOf(row), 0)
  const approved = rows.reduce((sum, row) => sum + countForStatus(row, STATUS.APPROVED), 0)
  const top = rows.reduce((best, row) => (countOf(row) > countOf(best) ? row : best), rows[0])

  return {
    referrals,
    share: all > 0 ? Math.round((referrals / all) * 100) : null,
    approved,
    topName: countOf(top) > 0 ? top.GroupName : null,
    topCount: countOf(top),
  }
}
