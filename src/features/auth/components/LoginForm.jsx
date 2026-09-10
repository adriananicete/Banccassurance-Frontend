/**
 * ============================================================================
 *  THIS FILE IS YOURS. Replace everything below with your design.
 * ============================================================================
 *
 * It is presentational only: no hooks, no fetching, no navigation. Everything
 * it needs arrives as a prop, and everything it does goes out as a callback.
 * `pages/LoginPage.jsx` is the container that supplies them.
 *
 * The props contract -- design against this and the wiring keeps working:
 *
 *   register      react-hook-form's register. Spread it onto each input:
 *                   <input {...register('identifier')} />
 *                 The field names are `identifier` and `password`.
 *
 *   errors        Per-field validation messages, e.g. errors.identifier?.message.
 *                 These come from zod, before any request is sent.
 *
 *   serverError   A string or null. THE BACKEND'S OWN WORDING -- show it as
 *                 given. Several endpoints answer the same status code for
 *                 different reasons and only the message distinguishes them,
 *                 so do not replace it with a generic line.
 *
 *   isPending     True while step one is in flight. Disable the submit button.
 *
 *   onSubmit      Pass straight to <form onSubmit={onSubmit}>. It is already
 *                 wrapped by handleSubmit, so it validates first.
 *
 * One thing worth knowing while you design the identifier field: it accepts
 * THREE things -- an email address, a user code (USR-STF-00001) or an employee
 * number. All three go in the same field. So the label should not say "Email".
 */
export function LoginForm({ register, errors, serverError, isPending, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-sm flex-col gap-4 p-8">
      <div>
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Use your email, user code, or employee number.
        </p>
      </div>

      {serverError ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {serverError}
        </p>
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        <span>Email, user code, or employee number</span>
        <input
          {...register('identifier')}
          autoComplete="username"
          autoFocus
          className="rounded-md border border-input px-3 py-2"
        />
        {errors.identifier ? (
          <span className="text-xs text-destructive">{errors.identifier.message}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>Password</span>
        <input
          {...register('password')}
          type="password"
          autoComplete="current-password"
          className="rounded-md border border-input px-3 py-2"
        />
        {errors.password ? (
          <span className="text-xs text-destructive">{errors.password.message}</span>
        ) : null}
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
      >
        {isPending ? 'Sending code…' : 'Continue'}
      </button>
    </form>
  )
}
