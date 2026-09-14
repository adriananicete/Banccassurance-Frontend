import { STATUS, countForStatus, sumStatusCounts } from '@/constants/status'
import { avatarUrl } from '@/lib/apiClient'

/**
 * Turning /reports and /users responses into what the Department Head
 * dashboard draws. Pure functions -- no fetching, no React -- so the container
 * stays readable and the arithmetic stays in one place.
 */

/** The "every region" choice. Not a region code, so it cannot collide with one. */
export const ALL_REGIONS = 'ALL'

/**
 * A /reports/summary row as referrals and approved.
 *
 * Referrals are the sum of the eight status columns, because the row has no
 * total. Both go through constants/status.js, never `row[status]` -- the
 * `Closed Pending` value and `ClosedPending` column differ.
 */
export function toFigures(row) {
  if (!row) return { total: 0, approved: 0 }
  return { total: sumStatusCounts(row), approved: countForStatus(row, STATUS.APPROVED) }
}

/** groupBy=MONTH rows as the chart's series. `GroupCode` is the month, "2026-09". */
export function toMonthly(rows = []) {
  return rows.map((row) => {
    const { total, approved } = toFigures(row)
    return { month: row.GroupCode, referrals: total, approved }
  })
}

/** Figures for the whole tenant: the sum of every region row. */
export function sumFigures(rows = []) {
  return rows.reduce(
    (sum, row) => {
      const { total, approved } = toFigures(row)
      return { total: sum.total + total, approved: sum.approved + approved }
    },
    { total: 0, approved: 0 },
  )
}

/**
 * Approved from GET /reports/dashboard's `byStatus`. Matched on the status
 * value, not on SortOrder -- the order is the database's to change.
 */
export function approvedFromByStatus(byStatus = []) {
  return byStatus.find((row) => row.Status === STATUS.APPROVED)?.Total ?? 0
}

function headFields(head) {
  return {
    headName: head?.fullName ?? null,
    headUserCode: head?.userCode ?? null,
    headAvatarSrc: avatarUrl(head?.photo),
  }
}

/**
 * The regions the dashboard lists.
 *
 * The list comes from /lookups/regions, not from the report rows, so a region
 * with no referrals still shows -- at zero -- rather than vanishing. Counts
 * are joined on RegionCode. The Regional Sales Head is the one whose scope
 * names the region; none is ordinary and renders as "no head".
 */
export function buildRegions(lookupRegions = [], regionRows = [], regionalHeads = []) {
  // At groupBy=REGION the row's GroupCode is the region code (rows are keyed
  // GroupCode/GroupName at every level). Matched on the name as well, so a
  // region still finds its row if that ever reads differently.
  const rowsByCode = new Map(regionRows.map((row) => [Number(row.GroupCode), row]))
  const rowsByName = new Map(regionRows.map((row) => [row.GroupName, row]))
  const headsByRegion = new Map()
  for (const head of regionalHeads) {
    const code = head.scope?.regionCode
    if (code != null && !headsByRegion.has(code)) headsByRegion.set(code, head)
  }

  // By code, so the tabs read NCR, Luzon, VisMin -- the lookup itself answers
  // in name order, which would put Luzon first.
  return [...lookupRegions].sort((a, b) => a.RegionCode - b.RegionCode).map((region) => ({
    code: region.RegionCode,
    name: region.RegionName,
    ...toFigures(rowsByCode.get(region.RegionCode) ?? rowsByName.get(region.RegionName)),
    ...headFields(headsByRegion.get(region.RegionCode)),
  }))
}

/**
 * The groups under the given regions, for the Groups table.
 *
 * `areaResults` is one { regionCode, rows } per region, from
 * /reports/summary?groupBy=AREA&parentRegionCode=. Those rows may leave out a
 * group with no referrals, so the list is UNIONED with every group an Area
 * Sales Head holds in that region -- a group someone runs shows at zero rather
 * than disappearing. A group in neither has no referrals and no head, and is
 * left out.
 *
 * One Area Sales Head may hold several groups; each group takes the first head
 * whose scope names it.
 */
export function buildGroups(areaResults = [], areaHeads = [], regions = []) {
  const regionNames = new Map(regions.map((region) => [region.code, region.name]))
  const headsByGroup = new Map()
  const heldGroups = []
  for (const head of areaHeads) {
    for (const group of head.scope ?? []) {
      if (!headsByGroup.has(group.groupCode)) {
        headsByGroup.set(group.groupCode, head)
        heldGroups.push(group)
      }
    }
  }

  return areaResults.flatMap(({ regionCode, rows }) => {
    const byCode = new Map(rows.map((row) => [Number(row.GroupCode), row]))
    for (const group of heldGroups) {
      if (group.regionCode === regionCode && !byCode.has(group.groupCode)) {
        byCode.set(group.groupCode, { GroupCode: group.groupCode, GroupName: group.groupName })
      }
    }

    return [...byCode.values()].map((row) => ({
      code: Number(row.GroupCode),
      name: row.GroupName,
      regionName: regionNames.get(regionCode) ?? null,
      ...toFigures(row),
      ...headFields(headsByGroup.get(Number(row.GroupCode))),
    }))
  })
}
