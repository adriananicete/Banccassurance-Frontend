import { DATE_PRESET } from '@/constants/presets'
import { manilaToday } from '@/lib/datetime'

/**
 * The Reports page's date range: the preset chips, the dates each one
 * covers, and the parameters each endpoint takes for it.
 *
 * Every preset the backend knows ends at the END of the current month and
 * starts on the 1st (context/BACKEND.md §9, "The date presets"), so the dates
 * shown here are computed the same way from today's Manila date. "Last month"
 * is not a backend preset; it is sent as `custom` with its two dates.
 *
 * Dates are `YYYY-MM-DD` strings throughout, built by calendar arithmetic, never
 * through a Date in the viewer's timezone.
 */

export const RANGE = {
  THIS_MONTH: 'thisMonth',
  LAST_MONTH: 'lastMonth',
  THREE_MONTHS: '3months',
  SIX_MONTHS: '6months',
  THIS_YEAR: 'thisYear',
  ALL_TIME: 'allTime',
  CUSTOM: 'custom',
}

export const RANGE_OPTIONS = [
  { value: RANGE.THIS_MONTH, label: 'This month' },
  { value: RANGE.LAST_MONTH, label: 'Last month' },
  { value: RANGE.THREE_MONTHS, label: 'Last 3 months' },
  { value: RANGE.SIX_MONTHS, label: 'Last 6 months' },
  { value: RANGE.THIS_YEAR, label: 'This year' },
  { value: RANGE.ALL_TIME, label: 'All time' },
  { value: RANGE.CUSTOM, label: 'Custom' },
]

const pad = (n) => String(n).padStart(2, '0')

/** { year, month } moved by `delta` months, month 1-12. */
function shiftMonth(year, month, delta) {
  const index = year * 12 + (month - 1) + delta
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

const firstDay = ({ year, month }) => `${year}-${pad(month)}-01`

// Day 0 of the next month is the last day of this one; UTC so no timezone moves it.
const lastDay = ({ year, month }) =>
  `${year}-${pad(month)}-${pad(new Date(Date.UTC(year, month, 0)).getUTCDate())}`

/**
 * { dateFrom, dateTo } a range covers, or nulls for All time. For Custom the
 * caller's own dates are returned untouched.
 */
export function datesFor(range, custom = {}, today = manilaToday()) {
  const [year, month] = today.split('-').map(Number)
  const now = { year, month }

  switch (range) {
    case RANGE.THIS_MONTH:
      return { dateFrom: firstDay(now), dateTo: lastDay(now) }
    case RANGE.LAST_MONTH: {
      const last = shiftMonth(year, month, -1)
      return { dateFrom: firstDay(last), dateTo: lastDay(last) }
    }
    case RANGE.THREE_MONTHS:
      return { dateFrom: firstDay(shiftMonth(year, month, -2)), dateTo: lastDay(now) }
    case RANGE.SIX_MONTHS:
      return { dateFrom: firstDay(shiftMonth(year, month, -5)), dateTo: lastDay(now) }
    case RANGE.THIS_YEAR:
      return { dateFrom: `${year}-01-01`, dateTo: lastDay(now) }
    case RANGE.CUSTOM:
      return { dateFrom: custom.dateFrom || null, dateTo: custom.dateTo || null }
    default:
      return { dateFrom: null, dateTo: null }
  }
}

/** Why a Custom range cannot be used yet, or null when it can. */
export function customRangeProblem({ dateFrom, dateTo }) {
  if (!dateFrom || !dateTo) return 'Pick both a start and an end date.'
  if (dateFrom > dateTo) return 'The start date is after the end date.'
  return null
}

/**
 * The period parameters for /reports/summary and /reports/export. Backend
 * presets go as `preset`; Last month and Custom go as `custom` with dates.
 */
export function periodParams(range, dates) {
  if (range === RANGE.LAST_MONTH || range === RANGE.CUSTOM) {
    return { preset: DATE_PRESET.CUSTOM, dateFrom: dates.dateFrom, dateTo: dates.dateTo }
  }
  return { preset: range }
}
