/**
 * ============================================================================
 *  THIS FILE IS YOURS. Still a placeholder -- replace it with your design.
 * ============================================================================
 *
 * Presentational. `pages/VerifyOtpPage.jsx` supplies every prop.
 *
 * It renders ONLY the <form>. The logo, the title and the card are in
 * `AuthLayout.jsx` and stay mounted while /login swaps to /login/verify, so
 * do not repeat them here -- that is the whole point of the split.
 *
 * The form classes below match LoginForm's exactly, so the card does not
 * change size between the two steps. Change them together if you change them.
 *
 * The props contract:
 *
 *   register      react-hook-form's register. One field: `otp`.
 *   errors        errors.otp?.message
 *   serverError   A string or null -- a wrong or expired code. Show as given.
 *   isPending     True while the code is being checked.
 *   onSubmit      Already wrapped by handleSubmit.
 *   identifier    What they signed in as, so they can tell it is the right
 *                 account. This is the value that must reach the API
 *                 unchanged; the container sends it, not this form.
 *   onStartOver   Goes back to the password step.
 *
 * THERE IS NO "RESEND CODE".
 * The only endpoint that sends an OTP is POST /auth/login-step1, and it needs
 * the password -- which this app never stores. So the honest action is to go
 * back and sign in again, which sends a fresh code. Label it "Start over" or
 * "Back to sign in", never "Resend": that would promise something this screen
 * cannot do.
 *
 * The code lasts 5 minutes and allows 5 attempts. In development it is printed
 * to the backend's own console -- it is never in a response body.
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
    <form
      onSubmit={onSubmit}
      className="flex w-full max-w-sm flex-col gap-6 px-14 py-4"
    >
      <div className="flex flex-col justify-center items-center">
        <h1 className="text-lg font-semibold">Enter your code</h1>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          We emailed a code to the address on <strong>{identifier}</strong>. It expires in 5
          minutes.
        </p>
      </div>

      {serverError ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {serverError}
        </p>
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        <span>Verification code *</span>
        <div className="border flex">
          <input
            {...register("otp")}
            autoComplete="one-time-code"
            inputMode="numeric"
            autoFocus
            className="border text-xs border-none px-3 py-2 w-full tracking-widest focus:outline-none focus:ring-0"
          />
        </div>
        {errors.otp ? (
          <span className="text-xs text-destructive">{errors.otp.message}</span>
        ) : null}
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer rounded-sm bg-indigo-950 px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
      >
        {isPending ? "Verifying…" : "Verify"}
      </button>

      <div className="flex justify-center items-center">
        <button
          type="button"
          onClick={onStartOver}
          className="cursor-pointer text-xs underline underline-offset-4"
        >
          Start over
        </button>
      </div>
    </form>
  );
}
