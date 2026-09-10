import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError, onSessionExpired } from '@/lib/apiClient'
import { queryKeys } from '@/lib/queryKeys'
import {
  clearDisplayProfile,
  clearSessionStorageAll,
  readDisplayProfile,
  saveDisplayProfile,
} from '@/lib/session'
import { fetchScope } from '@/features/users/api'
import { hasRole } from '@/constants/roles'

import { AuthContext } from './AuthContext'

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [profile, setProfile] = useState(readDisplayProfile)

  /**
   * The session bootstrap.
   *
   * `retry: false` matters: a 401 here is the ordinary answer for "not signed
   * in", and retrying it delays the redirect and burns rate limit.
   *
   * `refetchOnWindowFocus` is on for this one query, against the global
   * default. The backend re-reads role and scope from the database on every
   * request so that a deactivation or a scope change takes effect on the next
   * call -- refetching when the tab regains focus is what turns that into
   * something the user sees.
   */
  const scopeQuery = useQuery({
    queryKey: queryKeys.scope,
    queryFn: fetchScope,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const user = scopeQuery.data ?? null
  const isUnauthenticated = scopeQuery.error instanceof ApiError && scopeQuery.error.status === 401

  /**
   * A 401 on any other endpoint means the session ended mid-use -- an expired
   * token, or an account deactivated while it was signed in.
   *
   * This writes `null` into the scope cache rather than clearing it. Clearing
   * would leave the query with no data and trigger a refetch, which answers
   * 401, which fires this handler again. Writing null settles it in one pass:
   * the guards see no user and redirect, and the login route does not mount
   * this query at all.
   */
  useEffect(
    () =>
      onSessionExpired(() => {
        /**
         * ⚠️ THE DISPLAY PROFILE ONLY -- NOT the whole of session storage.
         *
         * This fires for the bootstrap probe's 401 too, which is the ordinary
         * answer on the login screen, and `refetchOnWindowFocus` fires it
         * again every time the tab regains focus. Clearing everything here
         * therefore wiped the pending OTP challenge each time the user
         * stepped out to read the code and came back.
         */
        clearDisplayProfile()
        setProfile(null)
        queryClient.setQueryData(queryKeys.scope, null)
        // Drop everything else so a re-login cannot show the previous
        // account's referrals for a frame.
        queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'scope' })
      }),
    [queryClient],
  )

  /** Called by the OTP step once the cookie is set. */
  const startSession = useCallback(
    async (userObject) => {
      saveDisplayProfile(userObject)
      setProfile(readDisplayProfile())

      /**
       * ⚠️ `staleTime: 0` IS LOAD-BEARING. Without it this returned instantly
       * with the wrong answer and the user was sent back to /login.
       *
       * `fetchQuery` takes its staleTime from the client's defaults -- 30
       * seconds here -- not from the `useQuery` above. And this cache entry
       * already held `null`, written by the session-expired handler when the
       * bootstrap probe answered 401 on the login screen. Worse, focusing the
       * tab refetched it, so stepping out to fetch the code from the inbox
       * and stepping back rewrote that `null` seconds before the OTP was
       * submitted. `fetchQuery` saw fresh data, made no request, and handed
       * back null -- no user, so RequireAuth bounced to /login.
       *
       * The cookie was just set; this has to go to the network.
       */
      await queryClient.fetchQuery({
        queryKey: queryKeys.scope,
        queryFn: fetchScope,
        staleTime: 0,
      })
    },
    [queryClient],
  )

  const endSession = useCallback(() => {
    clearSessionStorageAll()
    setProfile(null)
    queryClient.setQueryData(queryKeys.scope, null)
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'scope' })
  }, [queryClient])

  const value = useMemo(
    () => ({
      user,
      profile,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user),
      /** True only while we genuinely do not know yet -- guards render a splash. */
      isLoading: scopeQuery.isPending && !isUnauthenticated,
      isUnauthenticated,
      error: scopeQuery.error ?? null,
      can: (allowed) => hasRole(user?.role, allowed),
      refresh: scopeQuery.refetch,
      startSession,
      endSession,
    }),
    [user, profile, scopeQuery.isPending, scopeQuery.error, scopeQuery.refetch, isUnauthenticated, startSession, endSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
