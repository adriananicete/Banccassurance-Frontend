import { DATE_PRESET, DATE_PRESETS } from '@/constants/presets'

/**
 * Small formatting helpers shared by the tenant dashboards (Department Head,
 * Sector Head). Kept out of the component files so those export components only.
 */

/**
 * The periods on offer. Custom is left out until there is a date picker --
 * without dates it could only ever show a dash (Adrian, 2026-09-14).
 */
export const PERIOD_OPTIONS = DATE_PRESETS.filter((option) => option.value !== DATE_PRESET.CUSTOM)

/** Approved as a whole percentage of referrals, or null when there is nothing to divide. */
export function conversionRate(approved, total) {
  if (!total || approved == null) return null
  return Math.round((approved / total) * 100)
}

/** A share of a whole as a whole percentage; 0 when the whole is empty. */
export function shareOf(part, whole) {
  return whole > 0 ? Math.round(((part ?? 0) / whole) * 100) : 0
}

export function formatCount(value) {
  return value == null ? null : value.toLocaleString('en-PH')
}

/** "all time", "last 3 months" -- the preset's label, lower-cased for a sentence. */
export function presetLabel(value) {
  return DATE_PRESETS.find((option) => option.value === value)?.label.toLowerCase() ?? ''
}

/**
 * One hover tint per row in a places card -- Adrian's pick. Assigned by the
 * item's position in its list, NOT by rank, so a row keeps its tint when the
 * period reorders the list. Faint, with a dark pair. Full class strings, so
 * Tailwind can see them.
 */
export const PLACE_HOVERS = [
  'hover:bg-indigo-50/70 dark:hover:bg-indigo-500/10',
  'hover:bg-cyan-50/70 dark:hover:bg-cyan-500/10',
  'hover:bg-amber-50/70 dark:hover:bg-amber-500/10',
  'hover:bg-rose-50/70 dark:hover:bg-rose-500/10',
]
