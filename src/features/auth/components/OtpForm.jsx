/**
 * ============================================================================
 *  THIS FILE IS YOURS. Replace everything below with your design.
 * ============================================================================
 *
 * Presentational only. `pages/VerifyOtpPage.jsx` supplies every prop.
 *
 *   register      react-hook-form's register. One field: `otp`.
 *   errors        errors.otp?.message
 *   serverError   The backend's wording -- a wrong or expired code. Show as given.
 *   isPending     True while the code is being checked.
 *   onSubmit      Already wrapped by handleSubmit.
 *   identifier    What they signed in as. Shown so they can tell they are
 *                 verifying the right account.
 *   onStartOver   Goes back to the password step. See the note below.
 *
 * THERE IS NO "RESEND CODE".
 * The only endpoint that sends an OTP is POST /auth/login-step1, and it needs
 * the password -- which this app never stores. So the honest action is to go
 * back and sign in again, which sends a fresh code. Label it that way
 * ("Start over", "Back to sign in") rather than "Resend", which would promise
 * something this screen cannot do.
 *
 * The code is good for 5 minutes and allows 5 attempts.
 */
export function OtpForm({
  register,
  errors,
  serverError,
  isPending,
  onSubmit,
  identifier,
  onStartOver,
}) {
  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-sm flex-col gap-4 p-8">
      <div>
        <h1 className="text-xl font-semibold">Enter your code</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We emailed a code to the address on <strong>{identifier}</strong>. It expires in 5 minutes.
        </p>
      </div>

      {serverError ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {serverError}
        </p>
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        <span>Verification code</span>
        <input
          {...register('otp')}
          autoComplete="one-time-code"
          inputMode="numeric"
          autoFocus
          className="rounded-md border border-input px-3 py-2 tracking-widest"
        />
        {errors.otp ? <span className="text-xs text-destructive">{errors.otp.message}</span> : null}
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
      >
        {isPending ? 'Verifying…' : 'Verify'}
      </button>

      <button
        type="button"
        onClick={onStartOver}
        className="text-sm text-muted-foreground underline underline-offset-4"
      >
        Start over
      </button>
    </form>
  )
}
