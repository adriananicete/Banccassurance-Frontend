import { apiClient } from '@/lib/apiClient'

/**
 * Step one of two. Proves the password and EMAILS an OTP.
 *
 * Answers `{ success: true }` and sets no cookie. The OTP is never in the
 * response body -- outside production the backend prints it to its own
 * console, which is the practical way to sign in during development.
 *
 * `identifier` is whatever the user typed: Email, UserCode or EmployeeNo. All
 * three carry unique constraints, so none can name two accounts.
 */
export async function loginStep1({ identifier, password }) {
  const { data } = await apiClient.post('/auth/login-step1', { identifier, password })
  return data
}

/**
 * Step two. Proves the mailbox and sets the auth_token cookie.
 *
 * SEND THE SAME `identifier` AS STEP ONE. The OTP store is keyed by UserCode,
 * so a different value here finds no pending OTP even when step one succeeded.
 *
 * Returns the user object -- the only place FullName, Email, Photo and
 * EmployeeNo are ever served. See lib/session.js.
 */
export async function verifyOtp({ identifier, otp }) {
  const { data } = await apiClient.post('/auth/verify-otp', { identifier, otp })
  return data.user
}

/** Clears the cookie. */
export async function logout() {
  const { data } = await apiClient.post('/auth/logout')
  return data
}
