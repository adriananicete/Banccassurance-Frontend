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

/**
 * GET /users?role= -> every Regional Sales Head or Area Sales Head.
 *
 * `role` is REGIONAL_SALES_HEAD or AREA_SALES_HEAD; anything else is a 400.
 * DEPARTMENT_HEAD and SUPERADMIN only. No paging.
 *
 * Each row: { userId, userCode, fullName, photo, approved, scope }.
 *   Regional Sales Head  scope: { regionCode, regionName } | null
 *   Area Sales Head      scope: [{ groupCode, groupName, regionCode, regionName }]
 * Holding nothing is `null` for the first and `[]` for the second. Pending
 * heads are listed with `approved: false`; deactivated and rejected are not.
 *
 * ⚠️ FOR LABELS, NEVER FOR COUNTS. Totals are grouped by geography so a head
 * changing job does not move a region's history.
 */
export async function fetchHeadsByRole(role) {
  const { data } = await apiClient.get('/users', { params: { role } })
  return data.data ?? []
}

/**
 * GET /users/check-email?email= -> { exists }
 *
 * ⚠️ NO `success` KEY, and no `data`. One of the handful of endpoints that
 * does not use the common envelope.
 *
 * Unauthenticated -- registration needs it before a session exists. A missing
 * param answers `{ exists: false }` rather than a 400, so an empty string here
 * reads as "available" when it means "not asked". Only call it with an address
 * that has already passed shape validation.
 *
 * This is a courtesy, not a gate: POST /users/register answers 409 for a taken
 * address regardless, and between this check and that submit someone else can
 * register it.
 */
export async function checkEmail(email) {
  const { data } = await apiClient.get('/users/check-email', { params: { email } })
  return Boolean(data.exists)
}

/**
 * POST /users/register -> { success, message, userCode }
 *
 * Unauthenticated. Answers 200, not 201.
 *
 * ⚠️ WHICH CODE FIELD TO SEND DEPENDS ON THE ROLE, and sending a forbidden one
 * is a 400 naming it. The caller must build the payload from the matrix in
 * constants/roles.js -- see buildRegistrationPayload in ./schemas.js.
 *
 * ⚠️ NO PASSWORD IS SENT OR CHOSEN. The backend generates one
 * (`crypto.randomBytes(12).toString('base64url')`, 16 characters) and emails
 * it once. It is stored nowhere else, so a login that fails on an
 * app-created account is almost always the password rather than the
 * identifier.
 */
export async function register(payload) {
  const { data } = await apiClient.post('/users/register', payload)
  return data
}
