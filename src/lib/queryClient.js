import { QueryClient } from '@tanstack/react-query'

import { ApiError } from './apiClient'

/** Reference data changes rarely. Groups, regions and plans are safe to hold. */
export const LOOKUP_STALE_TIME = 60 * 60 * 1000 // 1 hour

/**
 * Retry only what a retry could fix.
 *
 * A 403 for missing consent, a 409 for a duplicate referral and a 400 for an
 * illegal transition are all answers, not failures -- repeating them wastes a
 * round trip and delays the message the user needs to read.
 *
 * 429 especially must not be retried: the API rate-limits login attempts by
 * identifier and consent sends by user, so an automatic retry spends the
 * user's own budget against them.
 */
function retry(failureCount, error) {
  if (error instanceof ApiError) {
    if (error.isNetworkError) return failureCount < 2
    if (error.status && error.status < 500) return false
  }
  return failureCount < 2
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
    },
    mutations: {
      // A mutation that failed has usually already had an effect, or has been
      // refused for a reason a repeat will not change. Never retry blind.
      retry: false,
    },
  },
})
