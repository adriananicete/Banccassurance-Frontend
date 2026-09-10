import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useLocation, useNavigate } from 'react-router'

import { isOtpExpired } from '@/lib/datetime'
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

  const challenge = readOtpChallenge()

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
          onStartOver={() => {
            clearOtpChallenge()
            navigate(paths.login, { replace: true, state: { from } })
          }}
        />
      )}
    />
  )
}
