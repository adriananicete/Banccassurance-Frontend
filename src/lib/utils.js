import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes so a later class wins over an earlier one that sets
 * the same property. Plain string concatenation does not do this -- both land
 * in the attribute and the CSS cascade, not the call site, picks the winner.
 *
 * Every shadcn primitive expects this to exist at `@/lib/utils`.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
