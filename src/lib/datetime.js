/**
 * Dates and times.
 *
 * Every timestamp in the API is UTC and the trailing `Z` is honest, so
 * comparing and sorting them is safe. Display is Manila.
 *
 * This uses Intl rather than a date library on purpose: the whole job is one
 * fixed timezone and a handful of formats, and Intl does that correctly
 * without a dependency or a tz database to keep current.
 *
 * One historical caveat, from context/BACKEND.md section 15: rows written
 * before 2026-08-28 are still eight hours out and nothing rewrote them. On the
 * reseeded database that is almost nothing -- an old date that looks wrong is
 * history, not a live defect.
 */

export const MANILA = 'Asia/Manila'

function toDate(value) {
  if (value == null) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const dateFormatter = new Intl.DateTimeFormat('en-PH', {
  timeZone: MANILA,
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-PH', {
  timeZone: MANILA,
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

const timeFormatter = new Intl.DateTimeFormat('en-PH', {
  timeZone: MANILA,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

const weekdayDateFormatter = new Intl.DateTimeFormat('en-PH', {
  timeZone: MANILA,
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

/** "10 Sep 2026". Returns `fallback` for null, undefined or an unparseable value. */
export function formatDate(value, fallback = '—') {
  const date = toDate(value)
  return date ? dateFormatter.format(date) : fallback
}

/**
 * "Friday, 11 September 2026". Defaults to today.
 *
 * For a screen heading rather than a data field -- it is the long, spelled-out
 * form, and `formatDate` stays the one for rows and lists. Manila like the rest,
 * so a viewer in another timezone reads the same day the data is filed under.
 */
export function formatWeekdayDate(value = new Date(), fallback = '—') {
  const date = toDate(value)
  return date ? weekdayDateFormatter.format(date) : fallback
}

/** "10 Sep 2026, 2:45 PM" -- in Manila, whatever the viewer's own timezone. */
export function formatDateTime(value, fallback = '—') {
  const date = toDate(value)
  return date ? dateTimeFormatter.format(date) : fallback
}

/** "2:45 PM". */
export function formatTime(value, fallback = '—') {
  const date = toDate(value)
  return date ? timeFormatter.format(date) : fallback
}

/**
 * The Manila calendar day, as `YYYY-MM-DD`.
 *
 * This is the format GET /reports/summary and /export take for `dateFrom` and
 * `dateTo` under `preset=custom`, and they are read as MANILA days -- so
 * `toISOString().slice(0, 10)` is wrong for eight hours of every day.
 *
 * `dateTo` is the last day INCLUDED, not an exclusive upper bound.
 */
export function toManilaDay(value) {
  const date = toDate(value)
  if (!date) return null
  // en-CA formats as YYYY-MM-DD, which is what the API wants.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: MANILA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/** Today, as a Manila `YYYY-MM-DD`. */
export function manilaToday() {
  return toManilaDay(new Date())
}

/**
 * The same Manila calendar day, N years earlier, as `YYYY-MM-DD`.
 *
 * Age boundaries are calendar arithmetic, so this subtracts from the year of
 * the Manila date string rather than shifting a Date object. Doing it on a
 * Date would apply the shift to a UTC instant, which is the wrong day for
 * eight hours out of every twenty-four here.
 *
 * A 29 February input can produce a date that does not exist in the target
 * year. That is fine and deliberate: these strings are only ever compared
 * lexicographically against other `YYYY-MM-DD` values, never parsed, and the
 * comparison lands where you would want it to.
 *
 * To compare an age, remember which way the inequality runs: an EARLIER
 * birthday means an OLDER person.
 *   at least 18   ->  birthday <= manilaDayYearsAgo(18)
 *   at most 70    ->  birthday >  manilaDayYearsAgo(71)
 */
export function manilaDayYearsAgo(years) {
  const [year, month, day] = manilaToday().split('-')
  return `${Number(year) - years}-${month}-${day}`
}

const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

const RELATIVE_UNITS = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
]

/** "3 hours ago", "yesterday". For notification and message lists. */
export function formatRelative(value, fallback = '—') {
  const date = toDate(value)
  if (!date) return fallback

  const elapsed = date.getTime() - Date.now()
  const magnitude = Math.abs(elapsed)

  if (magnitude < 60 * 1000) return 'just now'

  for (const [unit, ms] of RELATIVE_UNITS) {
    if (magnitude >= ms) {
      return relativeFormatter.format(Math.round(elapsed / ms), unit)
    }
  }
  return 'just now'
}

/**
 * An OTP started at `startedAt` is good for five minutes and five attempts.
 * Used by the verify screen to expire its own carried identifier rather than
 * sending one the server has already dropped.
 */
export const OTP_TTL_MS = 5 * 60 * 1000

export function isOtpExpired(startedAt) {
  const date = toDate(startedAt)
  if (!date) return true
  return Date.now() - date.getTime() > OTP_TTL_MS
}
