/**
 * Date presets for GET /reports/summary and GET /reports/export.
 *
 * Source: context/BACKEND.md section 9.
 */

export const DATE_PRESET = {
  /**
   * THE DEFAULT. A call with no `preset` returns the caller's whole history,
   * not the current month. `thisMonth` is a narrowing, not "the default".
   *
   * The reasoning is about what a report claims: a summary that quietly
   * defaults to the current month answers a narrower question than the one it
   * appears to answer, and whoever opens the screen reads it as a total.
   */
  ALL_TIME: 'allTime',
  THIS_MONTH: 'thisMonth',
  THREE_MONTHS: '3months',
  SIX_MONTHS: '6months',
  /** Starts 1 January -- not a rolling twelve months. */
  THIS_YEAR: 'thisYear',
  /** The only one that reads dateFrom and dateTo. */
  CUSTOM: 'custom',
}

export const DATE_PRESETS = [
  { value: DATE_PRESET.ALL_TIME, label: 'All time' },
  { value: DATE_PRESET.THIS_MONTH, label: 'This month' },
  { value: DATE_PRESET.THREE_MONTHS, label: 'Last 3 months' },
  { value: DATE_PRESET.SIX_MONTHS, label: 'Last 6 months' },
  { value: DATE_PRESET.THIS_YEAR, label: 'This year' },
  { value: DATE_PRESET.CUSTOM, label: 'Custom range' },
]

/**
 * Every preset runs to the END OF THE CURRENT MONTH, not to today. On 9
 * September, `thisMonth` is 1-30 September and includes twenty-one days that
 * have not happened. The counts are unaffected -- there are no referrals in
 * the future -- but the period LABEL on an export says the whole month, so a
 * file downloaded mid-month reads as a complete one. Known, and left as it is.
 *
 * The summary returns `period` in its response. Read that rather than
 * computing a label here.
 */

/**
 * GET /reports/summary?groupBy=
 *
 * Two trees, one per tenant:
 *   Landbank    AREA -> BRANCH
 *   PhilLife    REGION -> AREA -> AO
 *
 * CLUSTER is refused with a 400 even though the stored procedure accepts it --
 * a cluster has no head and is not a level. It survives only as a label on a
 * branch row.
 */
export const GROUP_BY = {
  REGION: 'REGION',
  AREA: 'AREA',
  BRANCH: 'BRANCH',
  AO: 'AO',
}

/**
 * The tier of GET /reports/dashboard's breakdown, one step down the caller's
 * own tree. `null` means they are at the bottom of it and `breakdown` is [].
 *
 * READ THIS FROM THE RESPONSE. Do not compute it from the role -- the mapping
 * lives in the backend and this list is documentation, not a lookup.
 *
 *   SECTOR_HEAD, REGIONAL_SALES_HEAD  -> AREA
 *   GROUP_HEAD                        -> BRANCH
 *   DEPARTMENT_HEAD                   -> REGION
 *   AREA_SALES_HEAD                   -> AO
 *   BRANCH_HEAD, BRANCH_STAFF,
 *   ACCOUNT_OFFICER                   -> null
 */
export const BREAKDOWN_LEVEL = {
  REGION: 'REGION',
  AREA: 'AREA',
  BRANCH: 'BRANCH',
  AO: 'AO',
}

/**
 * A group's total does NOT equal the sum of its branches, and this is correct.
 * An Account Officer's own referral carries no BranchCode, so it appears at
 * AREA and AO and vanishes at BRANCH.
 *
 * Say so on the screen, or it will be reported as a bug in the first week.
 */
export const BRANCH_ROLLUP_CAVEAT =
  'Referrals created by an Account Officer have no branch, so branch totals ' +
  'will not add up to the group total. They appear under the Account Officer instead.'
