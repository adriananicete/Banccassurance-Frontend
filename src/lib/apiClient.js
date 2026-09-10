import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1'

export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? 'http://localhost:5000'

/**
 * A normalised API failure.
 *
 * `message` is the backend's own wording. context/BACKEND.md is explicit that
 * several endpoints answer the same status code for different reasons --
 * POST /referrals alone has three distinct 403s and the status distinguishes
 * none of them -- and that the messages are written to be shown to the user.
 *
 * So: show `error.message`. Never replace it with a generic string.
 */
export class ApiError extends Error {
  constructor(message, { status = null, data = null, isNetworkError = false } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.isNetworkError = isNetworkError
  }

  /** 429. The message says which limit was hit -- an account limit and an address limit differ. */
  get isRateLimited() {
    return this.status === 429
  }
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  // The session is a JWT in an httpOnly cookie named auth_token. JavaScript
  // cannot read it and there is nothing to put in a header, so this flag IS
  // the authentication. Dropping it logs every request out silently.
  withCredentials: true,
  headers: { Accept: 'application/json' },
})

/**
 * Endpoints where a 401 is an ordinary answer rather than an expired session.
 *
 * login-step1 and verify-otp answer 401 for a wrong password or a wrong OTP.
 * Without this list, a mistyped password would clear the session and bounce
 * the user to /login -- the page they are already on -- and the real message
 * would never be shown.
 */
const UNAUTHENTICATED_PATHS = [
  '/auth/login-step1',
  '/auth/verify-otp',
  '/auth/logout',
  '/users/register',
  '/users/check-email',
  '/lookups/regions',
  '/lookups/groups',
  '/lookups/branches',
]

function isUnauthenticatedPath(url = '') {
  return UNAUTHENTICATED_PATHS.some((path) => url.startsWith(path))
}

/* -------------------------------------------------------------------------- */
/* Session-expiry notification                                                 */
/* -------------------------------------------------------------------------- */

const sessionExpiredHandlers = new Set()

/**
 * Called when an authenticated request comes back 401. AuthProvider subscribes
 * to clear its caches; the route guards do the redirecting.
 *
 * This is a plain subscription rather than a direct import so that apiClient
 * stays free of React and of the router.
 */
export function onSessionExpired(handler) {
  sessionExpiredHandlers.add(handler)
  return () => sessionExpiredHandlers.delete(handler)
}

/* -------------------------------------------------------------------------- */
/* Error normalisation                                                         */
/* -------------------------------------------------------------------------- */

// NOTE: there is deliberately no response interceptor that unwraps `data`.
// The shapes are not uniform -- /users/check-email answers { exists },
// /consent/check answers { status }, /notifications puts its list under
// `notifications` rather than `data`, and /reports/dashboard is flat. A
// blanket `res.data.data` would return undefined for four of them without
// throwing. Each feature's api.js knows its own shape.

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }

    const { response, config } = error

    if (!response) {
      return Promise.reject(
        new ApiError(
          'Cannot reach the server. Check that the backend is running on ' +
            `${API_ORIGIN} and that this origin is on its CLIENT_URL allowlist.`,
          { isNetworkError: true },
        ),
      )
    }

    const { status, data } = response

    if (status === 401 && !isUnauthenticatedPath(config?.url ?? '')) {
      for (const handler of sessionExpiredHandlers) handler()
    }

    // Two 401 messages, both meaning "send them back to login":
    // "Not authenticated" (no cookie) and "Invalid or expired session".
    const message =
      (typeof data?.message === 'string' && data.message) ||
      (status === 401 ? 'Your session has ended. Please sign in again.' : null) ||
      `Request failed with status ${status}.`

    return Promise.reject(new ApiError(message, { status, data }))
  },
)

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Build an absolute URL for an avatar.
 *
 * GET /uploads/<filename> sits OUTSIDE the /api/v1 prefix and serves images,
 * not JSON. Consent documents are never served over HTTP at all.
 *
 * Do not derive the image type from the stored filename: a PNG uploaded as
 * photo.jpg is stored with a .jpg extension.
 */
export function avatarUrl(photo) {
  if (!photo) return null
  return `${API_ORIGIN}/uploads/${photo}`
}
