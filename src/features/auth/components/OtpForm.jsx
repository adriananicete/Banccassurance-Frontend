/**
 * ============================================================================
 *  THIS FILE IS YOURS.
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
 *   otpValue      The code so far, as a string. May be shorter than six.
 *   onOtpChange   Called with the WHOLE string, never one digit.
 *   errors        errors.otp?.message
 *   serverError   A string or null -- a wrong or expired code. Show as given.
 *   isPending     True while the code is being checked.
 *   onSubmit      Already wrapped by handleSubmit.
 *   identifier    What they signed in as, so they can tell it is the right
 *                 account. This is the value that must reach the API
 *                 unchanged; the container sends it, not this form.
 *   expiresAt     Epoch ms when the code dies, for the counter beside the
 *                 label. It is the BROWSER's estimate of a SERVER deadline --
 *                 see the warning in hooks/useCountdown.js. Reaching zero does
 *                 not disable anything: the backend checks expiry before it
 *                 counts a wrong attempt, so submitting a dead code costs
 *                 nothing and returns a clearer message than we could write.
 *   onStartOver   Goes back to the password step.
 *
 * The boxes come from <OtpInput>, which owns the focus, keyboard and paste
 * behaviour so that restyling here cannot break it. `boxClassName` styles one
 * box and `className` styles the row -- both are yours.
 *
 * SIX BOXES, DIGITS ONLY. The backend generates the code as an integer from
 * 100000 to 999999, so it is always six digits with no leading zero, and it is
 * compared with a strict string match. See the note in components/OtpInput.jsx.
 *
 * THERE IS NO "RESEND CODE".
 * The only endpoint that sends an OTP is POST /auth/login-step1, and it needs
 * the password -- which this app never stores. So the honest action is to go
 * back and sign in again, which sends a fresh code. Label it "Start over" or
 * "Back to sign in", never "Resend": that would promise something this screen
 * cannot do.
 *
 * The code lasts 5 minutes and allows 5 wrong attempts. On the fifth the
 * backend DISCARDS it, so the only way forward is to start over -- the message
 * it sends says exactly that, and it is shown as given.
 *
 * In development the code is printed to the backend's own console. It is never
 * in a response body.
 */
import { OtpInput } from "@/components/OtpInput";
import { useCountdown } from "@/hooks/useCountdown";

export function OtpForm({
  otpValue,
  onOtpChange,
  errors,
  serverError,
  isPending,
  onSubmit,
  identifier,
  expiresAt,
  onStartOver,
}) {
  const countdown = useCountdown(expiresAt);
  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full max-w-sm flex-col gap-6 px-14 py-4"
    >
      <div className="flex flex-col justify-center items-center">
        <h1 className="text-lg font-semibold">Enter your code</h1>
        {/* "It expires in 5 minutes" was dropped from this line: the counter
            beside the label below now says the same thing, and says it live. */}
        <p className="mt-1 text-center text-xs text-muted-foreground">
          We emailed a code to the address on <strong>{identifier}</strong>.
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

      {/* A <div> rather than a <label>: a label points at ONE control, and
          there are six here. Each box carries its own "Digit 3 of 6" label. */}
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between items-center">
          <span id="otp-label">Verification code *</span>
          {/* role="timer" without aria-live: a region that announced itself
              every second would talk over everything else on the screen. */}
          <span
            role="timer"
            className={
              countdown.isExpired
                ? "text-xs text-destructive"
                : "text-xs text-muted-foreground tabular-nums"
            }
          >
            {countdown.isExpired ? "Code expired" : `Expires in ${countdown.formatted}`}
          </span>
        </div>
        <div
          role="group"
          aria-labelledby="otp-label"
          className="w-full h-[100px] flex justify-center items-center"
        >
          <OtpInput
            length={6}
            value={otpValue}
            onChange={onOtpChange}
            hasError={Boolean(errors.otp)}
            disabled={isPending}
            autoFocus
            boxClassName="w-12 h-14 border border-neutral-400 rounded-sm text-base focus:border-indigo-950"
          />
        </div>
        {errors.otp ? (
          <span className="text-xs text-destructive">{errors.otp.message}</span>
        ) : null}
      </div>

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
