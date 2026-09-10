import { apiClient } from '@/lib/apiClient'

/**
 * GET /users/scope -- what the caller holds.
 *
 * This is the session bootstrap. There is no `GET /users/me`, and this is the
 * only authenticated call that identifies the caller, so the app asks it on
 * every load: a 200 means signed in, a 401 means send them to /login.
 *
 * It answers:
 *   { userId, userCode, role, tenant, reach, scopes: [...], branches: [...] }
 *
 * READ `reach` BEFORE READING THE ARRAYS. An empty array means two opposite
 * things -- see constants/roles.js REACH. A Sector Head with `scopes: []` holds
 * the entire tenant; an Account Officer with `scopes: []` holds nothing and
 * cannot create a referral until an Area Sales Head assigns them branches.
 *
 * It is also the only correct source of scope for an AREA_SALES_HEAD or a
 * REGIONAL_SALES_HEAD: either can hold several groups, and the scalar
 * Users.GroupCode holds one of them on older rows -- a confidently wrong
 * answer rather than an empty one.
 */
export async function fetchScope() {
  const { data } = await apiClient.get('/users/scope')
  return data.data
}
