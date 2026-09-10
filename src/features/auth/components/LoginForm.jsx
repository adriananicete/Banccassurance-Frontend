/**
 * ============================================================================
 *  THIS FILE IS YOURS.
 * ============================================================================
 *
 * Presentational. `pages/LoginPage.jsx` supplies every prop; the logo, the
 * title and the card around this form live in `AuthLayout.jsx`, which stays
 * mounted while this swaps to OtpForm.
 *
 * The props contract:
 *
 *   register      react-hook-form's register. Fields: `identifier`, `password`.
 *   errors        errors.identifier?.message, errors.password?.message
 *   serverError   A string or null. THE BACKEND'S OWN WORDING -- show as given.
 *   isPending     True while step one is in flight.
 *   onSubmit      Already wrapped by handleSubmit; pass straight to <form>.
 *
 * Pure-UI state may live in this file -- the password toggle below is the
 * worked example. Anything that touches the server or the URL belongs in the
 * container instead.
 */
import { useState } from "react";
import { MdLogin } from "react-icons/md";
import { FiUser } from "react-icons/fi";
import { CiLock } from "react-icons/ci";
import { LuEye, LuEyeOff } from "react-icons/lu";
import { RiUserSharedLine } from "react-icons/ri";
import { Link } from "react-router";

import { paths } from "@/routes/paths";

export function LoginForm({
  register,
  errors,
  serverError,
  isPending,
  onSubmit,
}) {
  const [isPasswordVisible, setPasswordVisible] = useState(false);

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full max-w-sm flex-col gap-6 px-14 py-4"
    >
      <div className="w-full flex flex-col justify-center items-center gap-2">
        <div className="bg-[#ededed] p-2 w-14 flex justify-center items-center rounded-full shadow-inner">
          <div className="bg-white border p-2 w-full text-white rounded-full shadow-accent">
            <RiUserSharedLine size={20} color="#000" />
          </div>
        </div>

        <div className="flex flex-col justify-center items-center">
          <h1 className="text-lg font-semibold">Sign in</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Enter your credentials to login.
          </p>
        </div>
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
        <span>Employee number *</span>
        <div className="border flex">
          <div className="flex justify-center items-center px-2">
            <FiUser />
          </div>
          <input
            {...register("identifier")}
            autoComplete="username"
            placeholder="Employee Number or UserCode"
            // 254, the maximum length of an email address -- not the 20 used
            // on the password, which real addresses run past easily.
            maxLength={254}
            autoFocus
            className=" border text-xs border-none px-3 py-2 w-full focus:outline-none focus:ring-0"
          />
        </div>
        {errors.identifier ? (
          <span className="text-xs text-destructive">
            {errors.identifier.message}
          </span>
        ) : null}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>Password *</span>
        {/* Same shape as the identifier row above: the row stretches its
            children to full height, and each icon wrapper centres its own
            icon. Putting items-center on the row instead shrinks the wrappers
            to the icon's own height, so they float and the eye button becomes
            a ~14px tap target. */}
        <div className="border flex">
          <div className="flex justify-center items-center px-2">
            <CiLock />
          </div>
          <input
            {...register("password")}
            type={isPasswordVisible ? "text" : "password"}
            autoComplete="current-password"
            placeholder="******"
            // Matches the schema. Note this stops typing silently -- there is
            // no error for hitting a maxLength -- so the schema keeps the same
            // 20 as a backstop for anything pasted around it.
            maxLength={20}
            className="bg-transparent border text-xs border-none px-3 py-2 w-full focus:outline-none focus:ring-0"
          />
          {/* type="button" matters: a bare <button> inside a form defaults to
              submit, so toggling the password would post the login. */}
          <button
            type="button"
            onClick={() => setPasswordVisible((visible) => !visible)}
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            className="flex justify-center items-center px-2 cursor-pointer"
          >
            {isPasswordVisible ? <LuEye /> : <LuEyeOff />}
          </button>
        </div>
        {errors.password ? (
          <span className="text-xs text-destructive">
            {errors.password.message}
          </span>
        ) : null}
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer rounded-sm bg-indigo-950 px-3 py-2 text-sm text-primary-foreground disabled:opacity-50 flex justify-center items-center gap-2"
      >
        {" "}
        <MdLogin />
        {isPending ? "Sending code…" : "Login"}
      </button>

      <div className="flex justify-center items-center">
        <p className="text-xs">
          Don't have an account yet? <Link to={paths.register}>Sign Up</Link>
        </p>
      </div>
    </form>
  );
}
