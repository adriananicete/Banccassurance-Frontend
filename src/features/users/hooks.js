import { useMutation, useQuery } from '@tanstack/react-query'

import { LOOKUP_STALE_TIME } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'

import { checkEmail, fetchHeadsByRole, register } from './api'

/**
 * The Regional or Area Sales Heads, with photo and scope. Held like reference
 * data: who heads what changes when someone is assigned, not minute to minute.
 */
export function useHeadsByRole(role, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.users.byRole(role),
    queryFn: () => fetchHeadsByRole(role),
    enabled,
    staleTime: LOOKUP_STALE_TIME,
  })
}

export function useRegisterUser() {
  return useMutation({ mutationFn: register })
}

/**
 * Is this address already registered?
 *
 * A courtesy, not a gate. POST /users/register answers 409 for a taken
 * address regardless, and someone else can register it between this check and
 * the submit -- so the answer is a hint, and the 409 is the truth.
 *
 * Held for the session because the answer only changes when somebody
 * registers, and the address is checked once per typing pause rather than
 * once per keystroke: the endpoint is rate-limited by address, 60 per 15
 * minutes in production.
 */
export function useCheckEmail(email) {
  return useQuery({
    queryKey: queryKeys.users.checkEmail(email),
    queryFn: () => checkEmail(email),
    enabled: Boolean(email),
    staleTime: 5 * 60 * 1000,
  })
}
