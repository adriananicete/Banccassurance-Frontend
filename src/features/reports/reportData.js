import { STATUS, STATUSES, countForStatus, sumStatusCounts } from '@/constants/status'

/**
 * The Reports page's drill-down, per tenant. Each level is one
 * /reports/summary call; picking a row goes one level down, with that row as
 * the parent. The last level has nothing under it.
 *
 * Source: BACKEND.md §9 -- "PhilLife REGION → AREA → AO, Landbank AREA → BRANCH".
 * AREA rows are groups.
 */
export const REPORT_LEVELS = {
  PhilLife: [
    { groupBy: 'REGION', label: 'Region', plural: 'Regions' },
    { groupBy: 'AREA', label: 'Group', plural: 'Groups', parentParam: 'parentRegionCode' },
    { groupBy: 'AO', label: 'Account Officer', plural: 'Account Officers', parentParam: 'parentGroupCode' },
  ],
  Landbank: [
    { groupBy: 'AREA', label: 'Group', plural: 'Groups' },
    { groupBy: 'BRANCH', label: 'Branch', plural: 'Branches', parentParam: 'parentGroupCode' },
  ],
  /**
   * A Regional Sales Head enters the PhilLife tree at their own region
   * (BusinessLogic §10): their groups, then each group's Account Officers.
   * The summary is scoped to their groups by the session, so the top level
   * takes no parent.
   */
  PhilLifeRegion: [
    { groupBy: 'AREA', label: 'Group', plural: 'Groups' },
    { groupBy: 'AO', label: 'Account Officer', plural: 'Account Officers', parentParam: 'parentGroupCode' },
  ],
}

/**
 * One report row: its place, a count per status (in the business order of
 * STATUSES), its total and approved. Counts are read through constants/status.js
 * -- the `Closed Pending` value and `ClosedPending` column differ.
 */
function toReportRow(code, name, row) {
  return {
    code,
    name,
    counts: STATUSES.map((status) => countForStatus(row, status.value)),
    total: sumStatusCounts(row),
    approved: countForStatus(row, STATUS.APPROVED),
  }
}

/**
 * The rows for one level.
 *
 * A place with no referrals in the period is ABSENT from the summary (backend
 * F1). Where a lookup lists every place at this level -- regions, Landbank's
 * groups, a group's branches -- the table starts from it, so an empty place
 * shows at 0. Where none exists -- a region's groups (R7), a group's Account
 * Officers -- the table is the summary rows only.
 *
 *   lookup   [{ code, name }] or null
 *
 * Sorted by total, highest first; ties by name.
 */
export function buildReportRows(rows = [], lookup = null) {
  const byCode = new Map(rows.map((row) => [String(row.GroupCode), row]))

  const list = lookup
    ? lookup.map((place) => toReportRow(place.code, place.name, byCode.get(String(place.code))))
    : rows.map((row) => toReportRow(row.GroupCode, row.GroupName, row))

  return list.sort((a, b) => b.total - a.total || String(a.name).localeCompare(String(b.name)))
}

/** The column totals for the footer row: each status, then the grand total. */
export function reportTotals(rows = []) {
  return {
    counts: STATUSES.map((_, index) => rows.reduce((sum, row) => sum + row.counts[index], 0)),
    total: rows.reduce((sum, row) => sum + row.total, 0),
  }
}
