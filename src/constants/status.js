/**
 * The eight referral statuses.
 *
 * THE TRAP THIS FILE EXISTS FOR
 * ----------------------------
 * The status VALUE is `Closed Pending`, with a space. The report COLUMN that
 * counts it is `ClosedPending`, without one. It is the only two-word status,
 * so it is the only place the two disagree -- and nothing throws when they do.
 * A loop that reads `row[status]` gets undefined for exactly one of eight and
 * renders a confident zero.
 *
 * So: never index a /reports row by a status value. Use `column`.
 *
 * Source: context/BACKEND.md sections 7 and 9.
 */

export const STATUS = {
  REFERRED: 'Referred',
  PRESENTED: 'Presented',
  CLOSED_PENDING: 'Closed Pending',
  POSTPONED: 'Postponed',
  APPROVED: 'Approved',
  DECLINED: 'Declined',
  DEFERRED: 'Deferred',
  LOST: 'Lost',
}

/**
 * `sortOrder` is the business order and it lives in the database. It is
 * repeated here only so a list with no API response behind it can still sort.
 * When a response carries `SortOrder`, read that instead.
 */
export const STATUSES = [
  { value: STATUS.REFERRED, column: 'Referred', sortOrder: 1, label: 'Referred' },
  { value: STATUS.PRESENTED, column: 'Presented', sortOrder: 2, label: 'Presented' },
  { value: STATUS.CLOSED_PENDING, column: 'ClosedPending', sortOrder: 3, label: 'Closed Pending' },
  { value: STATUS.POSTPONED, column: 'Postponed', sortOrder: 4, label: 'Postponed' },
  { value: STATUS.APPROVED, column: 'Approved', sortOrder: 5, label: 'Approved' },
  { value: STATUS.DECLINED, column: 'Declined', sortOrder: 6, label: 'Declined' },
  { value: STATUS.DEFERRED, column: 'Deferred', sortOrder: 7, label: 'Deferred' },
  { value: STATUS.LOST, column: 'Lost', sortOrder: 8, label: 'Lost' },
]

const BY_VALUE = new Map(STATUSES.map((s) => [s.value, s]))

export function statusMeta(value) {
  return BY_VALUE.get(value) ?? null
}

/**
 * Read a per-status count off a /reports/summary or /reports/dashboard
 * breakdown row. Use this rather than `row[statusValue]`.
 */
export function countForStatus(row, statusValue) {
  const meta = BY_VALUE.get(statusValue)
  if (!meta || !row) return 0
  return row[meta.column] ?? 0
}

/**
 * A summary row has no total column. Sum the eight -- and note they need not
 * equal the group's referrals, because each column names a status literally,
 * so a status outside the eight counts in none of them.
 */
export function sumStatusCounts(row) {
  return STATUSES.reduce((total, s) => total + (row?.[s.column] ?? 0), 0)
}

/**
 * Four of the eight are written by the external underwriting system, not by
 * anyone in this app. A referral can change status with nobody in the UI
 * having acted -- so treat these as read-only rather than unreachable.
 */
export const UNDERWRITING_WRITTEN = [
  STATUS.CLOSED_PENDING,
  STATUS.APPROVED,
  STATUS.DECLINED,
  STATUS.POSTPONED,
]

/**
 * A DELIBERATE MIRROR OF A BACKEND RULE, and the only one in this codebase.
 *
 * We do not reimplement backend rules in the client. This is the exception
 * because there is no way to ask the API which transitions are legal before
 * the user clicks, and a screen has to decide which buttons to draw.
 *
 * It decides what is SHOWN. It never decides what is ALLOWED -- the server
 * does that, and PUT /referrals/:id/status answers 400 with a message naming
 * both statuses and listing what is legal from where the referral sits. That
 * message is written to be shown to the user; show it verbatim.
 *
 * Mirrors context/BACKEND.md section 7. If that section changes, change this.
 */
export const ALLOWED_TRANSITIONS = {
  [STATUS.REFERRED]: [STATUS.PRESENTED, STATUS.LOST, STATUS.DEFERRED],
  [STATUS.DEFERRED]: [STATUS.REFERRED, STATUS.PRESENTED],
  [STATUS.PRESENTED]: [STATUS.DEFERRED, STATUS.LOST],
  // Terminal from the app. Underwriting may still move the first and the last.
  [STATUS.CLOSED_PENDING]: [],
  [STATUS.LOST]: [],
  [STATUS.POSTPONED]: [],
  [STATUS.APPROVED]: [],
  [STATUS.DECLINED]: [],
}

export function transitionsFrom(status) {
  return ALLOWED_TRANSITIONS[status] ?? []
}

/**
 * `Lost` is terminal and deliberately does not free the client + plan pairing.
 * An Account Officer marking a referral `Lost` closes that client and that
 * plan permanently, and no role can reopen it. This is a business decision --
 * worth a confirmation step in the UI, and worth saying so in the wording.
 */
export const IRREVERSIBLE_STATUSES = [STATUS.LOST]

/** GET /referrals?verified= -- anything outside these two is no filter at all. */
export const VERIFIED_FILTERS = {
  VERIFIED: 'verified',
  NOT_VERIFIED: 'not-verified',
}

/**
 * GET /referrals?sortBy= whitelist. Anything outside it is SILENTLY IGNORED,
 * not rejected -- the list simply comes back in default order, which reads as
 * a broken sort rather than a bad parameter.
 *
 * `ReferralNo` is searchable but NOT sortable: it is
 * `REF-<date>-<6 random hex>`, so within a day the order is meaningless.
 * `CreatedAt` is what that sort is for.
 */
export const REFERRAL_SORT_FIELDS = [
  'Name',
  'Email',
  'ConsentStatus',
  'Status',
  'CreatedAt',
  'StatusDate',
]

/** GET /consent/check answers exactly three. */
export const CONSENT_STATUS = {
  /**
   * TWO STATES THAT CANNOT BE TOLD APART: a request is out and the client has
   * not answered, AND no usable request exists at all -- including right after
   * a referral consumed one. The database's fourth status, SUPERSEDED, is also
   * reported as PENDING and never reaches us.
   *
   * So the UI must not word this as "waiting for the client". It does not know.
   */
  PENDING: 'PENDING',
  /** The client opened the page and pressed "I Agree". */
  CONFIRMED: 'CONFIRMED',
  /** A signed paper form was uploaded by staff. */
  UPLOADED: 'UPLOADED',
}

/** Either of these satisfies the gate on POST /referrals. */
export const CONSENT_SATISFIED = [CONSENT_STATUS.CONFIRMED, CONSENT_STATUS.UPLOADED]

export function isConsentSatisfied(status) {
  return CONSENT_SATISFIED.includes(status)
}
