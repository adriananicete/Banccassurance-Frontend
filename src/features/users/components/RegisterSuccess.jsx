/**
 * ============================================================================
 *  THIS FILE IS YOURS. Restyle freely.
 * ============================================================================
 *
 * Shown in place of the form once registration is accepted.
 *
 *   userCode   The code the backend assigned, e.g. USR-STF-00042. Worth
 *              showing: it is one of the three things that can be typed into
 *              the sign-in field, and the only one the user has not chosen.
 *   message    The backend's own wording.
 *
 * TWO THINGS THIS SCREEN HAS TO SAY, because nothing else will:
 *
 * 1. THE PASSWORD IS EMAILED, ONCE, AND STORED NOWHERE ELSE. The user never
 *    chose one. Someone who deletes that email has no way to recover it from
 *    this system.
 * 2. THE ACCOUNT CANNOT BE USED UNTIL SOMEONE APPROVES IT. Registration,
 *    approval and scope are three separate steps, and a user who tries to sign
 *    in immediately will be refused for a reason this screen could have
 *    explained.
 */
import { LuMail } from "react-icons/lu";
import { Link } from "react-router";

import { paths } from "@/routes/paths";

export function RegisterSuccess({ userCode, message }) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6 px-14 py-6">
      <div className="w-full flex flex-col justify-center items-center gap-2">
        <div className="bg-[#ededed] p-2 w-14 flex justify-center items-center rounded-full shadow-inner">
          <div className="bg-white border p-2 w-full rounded-full shadow-accent">
            <LuMail size={20} color="#000" />
          </div>
        </div>

        <div className="flex flex-col justify-center items-center">
          <h1 className="text-lg font-semibold">Registration submitted</h1>
          {message ? (
            <p className="mt-1 text-center text-xs text-muted-foreground">{message}</p>
          ) : null}
        </div>
      </div>

      {userCode ? (
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-xs">Your user code</span>
          <div className="border flex">
            <p className="px-3 py-2 text-xs font-bold">{userCode}</p>
          </div>
          <span className="text-xs text-muted-foreground">
            You can sign in with this, your employee number, or your email.
          </span>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 text-xs text-muted-foreground">
        <p>
          <strong className="text-foreground">Check your email.</strong> Your password was sent
          there and is not stored anywhere else.
        </p>
        <p>
          <strong className="text-foreground">Wait for approval.</strong> Your account cannot be
          used until the person above you approves it.
        </p>
      </div>

      <Link
        to={paths.login}
        className="cursor-pointer rounded-sm bg-indigo-950 px-3 py-2 text-center text-sm text-primary-foreground"
      >
        Back to sign in
      </Link>
    </div>
  );
}
