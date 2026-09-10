/**
 * Two small pieces of browser storage, and a gap in the API.
 *
 * THE GAP
 * -------
 * There is no `GET /users/me`. The only call that ever returns FullName,
 * Email, Photo and EmployeeNo is POST /auth/verify-otp -- so after a browser
 * refresh there is no way to fetch them again.
 *
 * `GET /users/scope` returns userId, userCode, role, tenant, reach, scopes and
 * branches, and it is the AUTHORITY for every one of those. What it does not
 * return is anything to put in a header: a name and an avatar.
 *
 * So the display fields are cached here, and this is a stopgap. It has been
 * raised with the backend side as a request for a `GET /users/me` answering
 * the same object verify-otp does. Delete this file when that lands.
 *
 * NOTHING HERE IS AUTHORITATIVE.
 * Never read a role, a branch, a group or a scope from this cache. The backend
 * re-reads role and scope from the database on every request precisely so that
 * a deactivation or a scope change takes effect on the next call -- a cached
 * copy would be exactly the drift that design exists to prevent.
 */

const PROFILE_KEY = 'banca.profile'
const OTP_KEY = 'banca.otp'

/*
 * Storage can throw, not just come back empty -- a browser set to block site
 * data raises on the accessor itself. Every read and write below is guarded so
 * that a blocked browser degrades to "no cached name" rather than a blank app.
 */

function readJson(storage, key) {
  try {
    const raw = storage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeJson(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignored on purpose: this is a convenience cache, not state we need.
  }
}

function remove(storage, key) {
  try {
    storage.removeItem(key)
  } catch {
    // Ignored on purpose.
  }
}

/* -------------------------------------------------------------------------- */
/* Display-only profile                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Store the four display fields from the verify-otp user object.
 *
 * Role, BranchCode and GroupCode are deliberately NOT stored, even though
 * verify-otp returns them. They belong to GET /users/scope.
 */
export function saveDisplayProfile(user) {
  if (!user) return
  writeJson(localStorage, PROFILE_KEY, {
    fullName: user.FullName ?? null,
    email: user.Email ?? null,
    photo: user.Photo ?? null,
    employeeNo: user.EmployeeNo ?? null,
    userCode: user.UserCode ?? null,
  })
}

/**
 * The cached display fields, or null.
 *
 * Callers must render sensibly without them: a fresh browser, a cleared
 * profile or a blocked storage all give null while the session itself is
 * perfectly valid.
 */
export function readDisplayProfile() {
  return readJson(localStorage, PROFILE_KEY)
}

export function clearDisplayProfile() {
  remove(localStorage, PROFILE_KEY)
}

/* -------------------------------------------------------------------------- */
/* The login identifier, carried between the two login routes                  */
/* -------------------------------------------------------------------------- */

/**
 * THE SAME `identifier` MUST GO TO BOTH LOGIN STEPS.
 *
 * The OTP store is keyed by UserCode, so a different value on step two finds
 * no pending OTP even when step one succeeded and the OTP arrived. A user who
 * signs in with an employee number on /login and retypes their email on
 * /login/verify gets "invalid OTP" for a perfectly good code.
 *
 * Because the two steps are separate routes, the value has to survive a
 * refresh of /login/verify. sessionStorage does that and dies with the tab.
 *
 * The PASSWORD IS NEVER STORED. The identifier is an email, user code or
 * employee number -- something the user typed into a visible field, not a
 * secret -- and it buys a working refresh on the OTP screen.
 */
export function saveOtpChallenge(identifier) {
  writeJson(sessionStorage, OTP_KEY, { identifier, startedAt: new Date().toISOString() })
}

export function readOtpChallenge() {
  const challenge = readJson(sessionStorage, OTP_KEY)
  if (!challenge?.identifier) return null
  return challenge
}

export function clearOtpChallenge() {
  remove(sessionStorage, OTP_KEY)
}

/** Everything the browser is holding. Called on logout and on session expiry. */
export function clearSessionStorageAll() {
  clearDisplayProfile()
  clearOtpChallenge()
}
