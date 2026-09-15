import { ApiError, apiClient } from '@/lib/apiClient'

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

/**
 * GET /users/approvals -> { rows, pagination }
 *
 * The caller's queue: each approver role sees only the tier below it, and a
 * superadmin sees the Sector Heads and Department Heads of both tenants.
 *
 *   status   ALL | PENDING | APPROVED | REJECTED
 *   search   FullName or EmployeeNo. An empty string is not sent.
 *
 * `pagination.totalCount` follows the search.
 *
 * ⚠️ THE ROW COLUMNS ARE NOT DOCUMENTED. BACKEND.md names FullName, IsActive
 * and Status; the rest are read from the column list the six hand-written
 * queries used before the procedure replaced them (backend `805e625~1`):
 * UserId, UserCode, FirstName, LastName, Email, MobileNumber, Role, IsActive,
 * CreatedAt, Status. Every field is read with a fallback so a column the
 * procedure dropped renders as a dash instead of breaking the row.
 * `FullName` is null on seeded accounts' name parts, so it is preferred.
 */
export async function fetchApprovals({ status, search, page, pageSize }) {
  const { data } = await apiClient.get('/users/approvals', {
    params: { status, search: search || undefined, page, pageSize },
  })
  return { rows: (data.data ?? []).map(toApprovalRow), pagination: data.pagination ?? null }
}

function toApprovalRow(row) {
  const nameParts = [row.FirstName, row.LastName].filter(Boolean).join(' ')
  return {
    userId: row.UserId,
    userCode: row.UserCode ?? null,
    fullName: row.FullName || nameParts || null,
    employeeNo: row.EmployeeNo ?? null,
    email: row.Email ?? null,
    mobileNumber: row.MobileNumber ?? null,
    role: row.Role ?? null,
    status: row.Status ?? null,
    createdAt: row.CreatedAt ?? null,
    photo: row.Photo ?? null,
    // Where they registered. ⚠️ NOT DOCUMENTED on this list either (BACKEND-
    // REQUESTS R9): read if present, names filled from the lookups otherwise.
    // Landbank roles declare their own group and branch at registration; a
    // PhilLife role picks its approver's group or region (BACKEND.md §3).
    groupCode: row.GroupCode ?? row.AreaCode ?? null,
    groupName: row.GroupName ?? null,
    branchCode: row.BranchCode ?? null,
    branchName: row.BranchName ?? null,
    regionCode: row.RegionCode ?? null,
    regionName: row.RegionName ?? null,
  }
}

/**
 * POST /users/approvals/action { userId, action } -> { success, message }
 *
 * `action` is APPROVE | REJECT | DEACTIVATE | REACTIVATE. The last two are
 * superadmin only; every approver passes the route and the service answers 403.
 *
 * ⚠️ A REFUSAL CAN ARRIVE AS 200. When the procedure declines, the service
 * returns `{ success: false, message }` with a 200 status, so this throws on
 * `success: false` -- otherwise a refused approval would read as done.
 */
export async function actOnApproval({ userId, action }) {
  const { data } = await apiClient.post('/users/approvals/action', { userId, action })
  if (data?.success === false) {
    throw new ApiError(data.message || 'The account could not be updated.', { status: 200, data })
  }
  return data
}
