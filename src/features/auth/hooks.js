import { useMutation } from '@tanstack/react-query'

import { clearOtpChallenge, saveOtpChallenge } from '@/lib/session'

import { loginStep1, logout, verifyOtp } from './api'
import { useAuth } from './AuthContext'

/**
 * Step one. On success the OTP is in the user's inbox -- and, outside
 * production, in the backend's console.
 *
 * The identifier is stored here rather than in the page so that step two
 * cannot send a different one. See lib/session.js for why that matters.
 */
export function useLoginStep1() {
  return useMutation({
    mutationFn: loginStep1,
    onSuccess: (_data, variables) => {
      saveOtpChallenge(variables.identifier)
    },
  })
}

/**
 * Step two. Sets the cookie, then fetches the scope so the app knows the role
 * before the caller navigates into a guarded route.
 */
export function useVerifyOtp() {
  const { startSession } = useAuth()

  return useMutation({
    mutationFn: verifyOtp,
    onSuccess: async (user) => {
      clearOtpChallenge()
      await startSession(user)
    },
  })
}

/**
 * Logout clears the cookie server-side. The local caches are cleared whether
 * or not that call succeeded -- a network failure must not leave the user
 * looking at a session they can no longer use.
 */
export function useLogout() {
  const { endSession } = useAuth()

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      endSession()
    },
  })
}
