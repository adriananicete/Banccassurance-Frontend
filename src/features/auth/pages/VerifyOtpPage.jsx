import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useLocation, useNavigate } from 'react-router'

import { OTP_TTL_MS, isOtpExpired } from '@/lib/datetime'
import { clearOtpChallenge, readOtpChallenge } from '@/lib/session'
import { paths } from '@/routes/paths'

import { OtpForm } from '../components/OtpForm'
import { useVerifyOtp } from '../hooks'
import { verifyOtpSchema } from '../schemas'

/**
 * Step two of two: prove the mailbox, and the auth_token cookie is set.
 *
 * The identifier comes from sessionStorage, not from this form and not from
 * router state. It has to be BYTE-IDENTICAL to what step one sent -- the OTP
 * store is keyed by UserCode, so a different value finds no pending OTP even
 * when the code in the user's inbox is perfectly good. Router state alone
 * would not survive a refresh of this route; sessionStorage does.
 */
export function VerifyOtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from

  /**
   * READ ONCE, ON MOUNT. Not on every render.
   *
   * A successful verification clears the challenge from sessionStorage and
   * then establishes the session, and establishing it re-renders this page.
   * Re-reading storage on that render found nothing, so the stale-challenge
   * guard below fired and sent a freshly signed-in user to /login -- where
   * GuestOnly, now seeing a session, bounced them onward to the dashboard.
   * That was the flash of the login screen between the OTP and the app.
   *
   * Holding the value in state means the page renders against what it was
   * given, not against storage that has legitimately moved on.
   */
  const [challenge] = useState(readOtpChallenge)

  /**
   * `control` rather than `register`: the code is entered across six boxes
   * that together hold one value, so the field is controlled. OtpForm receives
   * the whole string and hands back the whole string -- it never deals in
   * single digits, and neither does the schema.
   */
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { otp: '' },
  })

  const verifyMutation = useVerifyOtp()

  // Arriving here directly, or after the code has aged out, means there is
  // nothing to verify against. Send them back rather than posting an
  // identifier the server has already dropped.
  if (!challenge || isOtpExpired(challenge.startedAt)) {
    clearOtpChallenge()
    return <Navigate to={paths.login} replace state={{ from }} />
  }

  const onSubmit = handleSubmit((values) => {
    verifyMutation.mutate(
      { identifier: challenge.identifier, otp: values.otp },
      {
        onSuccess: () => {
          navigate(from?.pathname ?? paths.home, { replace: true })
        },
      },
    )
  })

  return (
    <Controller
      name="otp"
      control={control}
      render={({ field }) => (
        <OtpForm
          otpValue={field.value}
          onOtpChange={field.onChange}
          errors={errors}
          serverError={verifyMutation.error?.message ?? null}
          isPending={verifyMutation.isPending}
          onSubmit={onSubmit}
          identifier={challenge.identifier}
          // The guard above runs on render, so it catches a stale challenge on
          // ARRIVAL. It does not fire again while the user sits here, which is
          // deliberate: expiring in place and letting them press Start over
          // beats yanking them back to the password screen mid-keystroke.
          expiresAt={new Date(challenge.startedAt).getTime() + OTP_TTL_MS}
          onStartOver={() => {
            clearOtpChallenge()
            navigate(paths.login, { replace: true, state: { from } })
          }}
        />
      )}
    />
  )
}
