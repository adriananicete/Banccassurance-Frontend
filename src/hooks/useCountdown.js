import { useEffect, useState } from 'react'

/**
 * Counts down to a timestamp, ticking once a second.
 *
 * `expiresAt` is epoch milliseconds, or null to sit idle.
 *
 * Returns `{ remainingMs, isExpired, formatted }`, where `formatted` is
 * `m:ss`. The interval stops once it reaches zero -- there is nothing left to
 * recompute, and a timer that keeps firing on a dead screen is a leak in
 * everything but name.
 *
 * ⚠️ THIS CLOCK IS THE BROWSER'S, AND THE DEADLINE IS THE SERVER'S.
 * For the OTP, the backend stamps `Date.now() + 5 minutes` when it handles
 * step one; we stamp ours when the response arrives. So ours starts a little
 * later and runs out a little later, and the two also drift with clock skew.
 * Treat what this shows as an indication, never as the authority -- the server
 * decides, and it answers "OTP expired" in words meant to be shown.
 */
export function useCountdown(expiresAt) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!expiresAt) return undefined
    // Re-read the clock on every tick rather than subtracting a second from a
    // counter: a backgrounded tab throttles its timers, and a decrementing
    // counter would come back wrong by however long it was hidden.
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  const remainingMs = expiresAt ? Math.max(0, expiresAt - now) : 0
  const totalSeconds = Math.ceil(remainingMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return {
    remainingMs,
    isExpired: Boolean(expiresAt) && remainingMs <= 0,
    formatted: `${minutes}:${String(seconds).padStart(2, '0')}`,
  }
}
