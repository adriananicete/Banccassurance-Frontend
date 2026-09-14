import { apiClient } from '@/lib/apiClient'

/**
 * Reference data.
 *
 * ⚠️ THREE OF THESE FOUR ARE UNAUTHENTICATED ON PURPOSE -- public
 * registration needs them before any session exists. Only `/lookups/plans`
 * takes the cookie, which is why it plays no part in the registration screen.
 */

/**
 * GET /lookups/regions -> [{ RegionCode, RegionName }].
 *
 * Three today: NCR 1, Luzon 2, VisMin 3 (checked live 2026-09-14; the old
 * "only NCR is seeded" note was out of date). ⚠️ Branches exist only in NCR's
 * groups, so Luzon and VisMin hold no referrals yet and every figure for them
 * reads zero -- that is data, not a defect.
 */
export async function fetchRegions() {
  const { data } = await apiClient.get('/lookups/regions')
  return data.data
}

/**
 * GET /lookups/groups -> [{ GroupCode, GroupName }]. All 15.
 *
 * Every group is mapped to a region in the database, but this lookup does not
 * say which -- for that, an Area Sales Head's scope from GET /users?role= does.
 *
 * ⚠️ ONLY GROUPS 1-3 CARRY BRANCHES today. The other twelve are real rows that
 * resolve to a real name and hold nothing, so a branch list can come back
 * empty without anything being wrong. Say "no branches in this group" rather
 * than rendering a silent empty select.
 *
 * ⚠️ NEVER hardcode a code-to-name pairing. 1 is CENTRAL NCR, 2 is NORTH NCR,
 * 3 is SOUTH NCR -- and they were swapped in a reseed once. A wrong pairing
 * does not fail loudly, because every code resolves to some real group.
 */
export async function fetchGroups() {
  const { data } = await apiClient.get('/lookups/groups')
  return data.data
}

/**
 * GET /lookups/branches -> { data: [...], pagination }
 *
 * Params: groupCode, search, page, pageSize (default and cap both 100).
 *
 * ⚠️ ALWAYS PASS A groupCode when the list is for choosing one branch. There
 * are 136 branches and the page cap is 100, so an unfiltered call silently
 * returns a partial list -- the user's branch may simply not be in it. The
 * largest group holds 52, so any filtered call fits in one page.
 *
 * ⚠️ A non-numeric groupCode reads as "no filter", not as an error:
 * `?groupCode=abc` answers the unfiltered first page rather than a 400. That
 * is the signal the parameter did not arrive as intended.
 */
export async function fetchBranches({ groupCode, search, page = 1, pageSize = 100 } = {}) {
  const { data } = await apiClient.get('/lookups/branches', {
    // axios encodes params, which matters wherever a value can contain a `+`
    // or a space. Never build this query by string concatenation.
    params: { groupCode, search, page, pageSize },
  })
  return { rows: data.data, pagination: data.pagination }
}

/** GET /lookups/plans -> the plan list for the referral form. Needs the cookie. */
export async function fetchPlans() {
  const { data } = await apiClient.get('/lookups/plans')
  return data.data
}
