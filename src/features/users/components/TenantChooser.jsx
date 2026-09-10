/**
 * ============================================================================
 *  THIS FILE IS YOURS. Restyle freely.
 * ============================================================================
 *
 * The first step of registration: which company do you work for?
 *
 * Presentational. `pages/ChooseTenantPage.jsx` decides what the options are.
 *
 *   options   [{ slug, label, description, logo, to }] -- `logo` is an
 *             imported image, `to` is the route for that company's form.
 *
 * WHY THIS SCREEN EXISTS AT ALL, beyond being a nicer entry point: the eight
 * registerable roles split four and four between the two companies, and
 * nothing on the form itself would tell someone which four are theirs. Asking
 * the company first turns a dropdown of eight into a dropdown of four, and the
 * four that are left are the only ones they could correctly pick.
 *
 * The tenant is NOT sent to the API. The backend derives it from the role and
 * stamps it into the UserCode prefix -- USR- for Landbank, PHL- for PhilLife.
 * So this choice narrows the form; it does not add a field.
 */
import { LuChevronRight } from "react-icons/lu";
import { Link } from "react-router";

import { paths } from "@/routes/paths";

export function TenantChooser({ options }) {
  return (
    <div className="flex w-full max-w-md flex-col gap-6 px-10 py-6">
      <div className="flex flex-col justify-center items-center">
        <h1 className="text-lg font-semibold">Create your account</h1>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Which company do you work for?
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {options.map((option) => (
          <Link
            key={option.slug}
            to={option.to}
            className="border rounded-sm flex items-center gap-4 p-4 hover:border-indigo-950 hover:shadow-md"
          >
            <img
              src={option.logo}
              alt=""
              className="h-10 w-24 shrink-0 object-contain"
            />
            <span className="flex flex-col">
              <span className="text-sm font-semibold">{option.label}</span>
              <span className="text-xs text-muted-foreground">
                {option.description}
              </span>
            </span>
            <LuChevronRight aria-hidden className="ml-auto shrink-0" />
          </Link>
        ))}
      </div>

      <div className="flex justify-center items-center">
        <p className="text-xs">
          Already have an account?{" "}
          <Link to={paths.login} className="font-bold hover:text-[#157d03]">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
