import { apiClient } from '@/lib/apiClient'

/**
 * The three /reports endpoints. Scoping is automatic -- the session decides
 * what the caller sees, and nothing here takes a role or a scope.
 *
 * Source: context/BACKEND.md section 9, and the backend's reportService.js.
 */

/**
 * GET /reports/dashboard -> { total, byStatus, level, breakdown }
 *
 * ⚠️ FLAT, NOT UNDER `data`, and ALWAYS ALL TIME -- it takes no parameters.
 * `byStatus` rows are `{ SortOrder, Status, Total }` and always sum to `total`.
 * A dated question is /summary.
 */
export async function fetchDashboard() {
  const { data } = await apiClient.get('/reports/dashboard')
  return {
    total: data.total,
    byStatus: data.byStatus ?? [],
    level: data.level ?? null,
    breakdown: data.breakdown ?? [],
  }
}

/**
 * GET /reports/summary -> { groupBy, period, rows }
 *
 * `groupBy` is REGION | AREA | BRANCH | AO | MONTH. Rows are keyed
 * `GroupCode` / `GroupName` at every level -- at MONTH both are "2026-09" --
 * and carry the eight status columns. THERE IS NO TOTAL COLUMN; read counts
 * through constants/status.js, never `row[status]`.
 *
 * Params left undefined are dropped by axios, so a missing parent or preset
 * is simply not sent. A call with no preset is all time, not this month.
 * `dateFrom` / `dateTo` are read only with `preset=custom`: Manila days as
 * YYYY-MM-DD, and `dateTo` is the last day INCLUDED.
 */
export async function fetchSummary({
  groupBy,
  preset,
  parentRegionCode,
  parentGroupCode,
  dateFrom,
  dateTo,
}) {
  const { data } = await apiClient.get('/reports/summary', {
    params: { groupBy, preset, parentRegionCode, parentGroupCode, dateFrom, dateTo },
  })
  return { groupBy: data.groupBy, period: data.period ?? null, rows: data.rows ?? [] }
}

/**
 * GET /reports/export?preset= -> an .xlsx file, saved in the browser.
 *
 * Always the caller's whole scope (BACKEND-REQUESTS Q2) -- it takes no region.
 * The filename is the backend's, read from Content-Disposition, which CORS now
 * exposes (R5). Without that header the fallback name is used.
 */
export async function downloadExport({ preset }) {
  const response = await apiClient.get('/reports/export', {
    params: { preset },
    responseType: 'blob',
  })

  const disposition = response.headers['content-disposition'] ?? ''
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)
  const filename = match ? decodeURIComponent(match[1]) : 'referrals.xlsx'

  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revoked on the next tick: some browsers start the download asynchronously
  // and an immediate revoke cancels it.
  setTimeout(() => URL.revokeObjectURL(url), 0)

  return filename
}
