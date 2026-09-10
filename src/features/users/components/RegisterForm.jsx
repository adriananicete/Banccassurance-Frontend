/**
 * ============================================================================
 *  THIS FILE IS YOURS. Built to match LoginForm's pattern -- restyle freely.
 * ============================================================================
 *
 * Presentational. `pages/RegisterPage.jsx` supplies every prop, fetches every
 * dropdown, and decides which fields this role is allowed to send.
 *
 * The rows reuse LoginForm's shape exactly: a bordered row that stretches its
 * children to full height, an icon wrapper that centres its own icon, and a
 * borderless text-xs input. `Field` and `SelectField` at the bottom hold that
 * markup once so a restyle is one edit rather than eleven.
 *
 * The props contract:
 *
 *   register / errors / onSubmit / isPending / serverError
 *                   As in LoginForm. `serverError` is the backend's own
 *                   wording -- show it as given. Registration has several
 *                   distinct 400s and 409s and only the message separates
 *                   them.
 *
 *   roleOptions     [{ value, label }] -- the EIGHT registerable roles.
 *                   SUPERADMIN is never among them; it is seeded, never
 *                   registered, and answers 400.
 *
 *   codeFields      { group, branch, region, groupRequired, ... } -- which of
 *                   the three location fields this role may send. Render only
 *                   what is true. SENDING A FORBIDDEN ONE IS A 400, so a field
 *                   shown for the wrong role is not cosmetic.
 *
 *   regions / groups / branches      Dropdown rows, already fetched.
 *   isLoadingGroups / isLoadingBranches
 *   hasGroupSelected                 The branch select stays disabled until a
 *                                    group is chosen -- see the note on it.
 *
 *   emailTaken      true / false / null. A courtesy check; the submit answers
 *                   409 for a taken address regardless.
 *   onEmailBlur     Fires the check.
 *
 * WHAT THE USER PICKS HERE IS THEIR APPROVER'S SCOPE, NOT THEIR OWN. An
 * Account Officer choosing a group is naming whose queue they land in; the
 * branches they will cover are assigned afterwards by that Area Sales Head.
 * Wording that says "your group" would be wrong.
 */
import { FiUser } from "react-icons/fi";
import {
  LuBriefcase,
  LuBuilding2,
  LuCalendar,
  LuHash,
  LuLayers,
  LuMail,
  LuMapPin,
  LuPhone,
  LuUserPlus,
} from "react-icons/lu";
import { Link } from "react-router";

import { paths } from "@/routes/paths";

export function RegisterForm({
  register,
  errors,
  onSubmit,
  isPending,
  serverError,
  roleOptions,
  codeFields,
  regions,
  groups,
  branches,
  isLoadingGroups,
  isLoadingBranches,
  hasGroupSelected,
  emailTaken,
  onEmailBlur,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full max-w-2xl flex-col gap-6 px-10 py-6"
    >
      <div className="w-full flex flex-col justify-center items-center gap-2">
        <div className="bg-[#ededed] p-2 w-14 flex justify-center items-center rounded-full shadow-inner">
          <div className="bg-white border p-2 w-full text-white rounded-full shadow-accent">
            <LuUserPlus size={20} color="#000" />
          </div>
        </div>

        <div className="flex flex-col justify-center items-center">
          <h1 className="text-lg font-semibold">Create your account</h1>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Your password will be emailed to you once your registration is approved.
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

      <SelectField
        label="Role"
        required
        icon={<LuBriefcase />}
        error={errors.role}
        registration={register("role")}
        placeholder="Select your role"
        options={roleOptions}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="First name"
          required
          icon={<FiUser />}
          error={errors.firstName}
          registration={register("firstName")}
          maxLength={60}
        />
        <Field
          label="Middle name"
          icon={<FiUser />}
          error={errors.middleName}
          registration={register("middleName")}
          maxLength={60}
        />
        <Field
          label="Last name"
          required
          icon={<FiUser />}
          error={errors.lastName}
          registration={register("lastName")}
          maxLength={60}
        />
        <Field
          label="Suffix"
          icon={<FiUser />}
          error={errors.suffix}
          registration={register("suffix")}
          placeholder="Jr., III"
          maxLength={20}
        />
        <Field
          label="Birthday"
          required
          type="date"
          icon={<LuCalendar />}
          error={errors.birthday}
          registration={register("birthday")}
        />
        <Field
          label="Mobile number"
          required
          icon={<LuPhone />}
          error={errors.mobileNumber}
          registration={register("mobileNumber")}
          placeholder="09XXXXXXXXX"
          maxLength={20}
        />
        <Field
          label="Employee number"
          required
          icon={<LuHash />}
          error={errors.employeeNo}
          registration={register("employeeNo")}
          maxLength={40}
        />
        <Field
          label="Email"
          required
          type="email"
          icon={<LuMail />}
          error={errors.email}
          registration={register("email")}
          onBlur={onEmailBlur}
          maxLength={254}
          hint={
            emailTaken === true
              ? "That email is already registered."
              : emailTaken === false
                ? "That email is available."
                : null
          }
          hintTone={emailTaken === true ? "bad" : "good"}
        />
      </div>

      {codeFields.region || codeFields.group || codeFields.branch ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {codeFields.region ? (
            <SelectField
              label="Region"
              required={codeFields.regionRequired}
              icon={<LuMapPin />}
              error={errors.regionCode}
              registration={register("regionCode")}
              placeholder="Select a region"
              options={regions.map((region) => ({
                value: String(region.RegionCode),
                label: region.RegionName,
              }))}
            />
          ) : null}

          {codeFields.group ? (
            <SelectField
              label="Group"
              required={codeFields.groupRequired}
              icon={<LuLayers />}
              error={errors.groupCode}
              registration={register("groupCode")}
              placeholder={isLoadingGroups ? "Loading…" : "Select a group"}
              disabled={isLoadingGroups}
              options={groups.map((group) => ({
                value: String(group.GroupCode),
                label: group.GroupName,
              }))}
            />
          ) : null}

          {codeFields.branch ? (
            <SelectField
              label="Branch"
              required={codeFields.branchRequired}
              icon={<LuBuilding2 />}
              error={errors.branchCode}
              registration={register("branchCode")}
              // The branch list is fetched per group on purpose: there are 136
              // branches against a page cap of 100, so an unfiltered call
              // returns a partial list that looks complete.
              disabled={!hasGroupSelected || isLoadingBranches}
              placeholder={
                !hasGroupSelected
                  ? "Choose a group first"
                  : isLoadingBranches
                    ? "Loading…"
                    : branches.length === 0
                      ? "No branches in this group"
                      : "Select a branch"
              }
              options={branches.map((branch) => ({
                value: String(branch.BranchCode),
                label: branch.BranchName,
              }))}
            />
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer rounded-sm bg-indigo-950 px-3 py-2 text-sm text-primary-foreground disabled:opacity-50 flex justify-center items-center gap-2"
      >
        <LuUserPlus />
        {isPending ? "Submitting…" : "Create account"}
      </button>

      <div className="flex justify-center items-center">
        <p className="text-xs">
          Already have an account?{" "}
          <Link to={paths.login} className="font-bold hover:text-[#157d03]">
            Sign In
          </Link>
        </p>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* The two row shapes, held once                                               */
/* -------------------------------------------------------------------------- */

function Field({
  label,
  required = false,
  icon,
  error,
  registration,
  hint,
  hintTone = "good",
  onBlur,
  ...inputProps
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs">
        {label} {required ? "*" : null}
      </span>
      <div className="border flex">
        <div className="flex justify-center items-center px-2">{icon}</div>
        <input
          {...registration}
          // react-hook-form's registration carries its own onBlur, so an extra
          // one has to call it rather than replace it -- dropping it would
          // stop the field ever being marked as touched.
          onBlur={(event) => {
            registration.onBlur(event);
            onBlur?.(event);
          }}
          {...inputProps}
          className="bg-transparent border text-xs border-none px-3 py-2 w-full focus:outline-none focus:ring-0"
        />
      </div>
      {error ? (
        <span className="text-xs text-destructive">{error.message}</span>
      ) : hint ? (
        <span
          className={
            hintTone === "bad"
              ? "text-xs text-destructive"
              : "text-xs text-muted-foreground"
          }
        >
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function SelectField({
  label,
  required = false,
  icon,
  error,
  registration,
  options,
  placeholder,
  disabled = false,
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs">
        {label} {required ? "*" : null}
      </span>
      <div className="border flex">
        <div className="flex justify-center items-center px-2">{icon}</div>
        <select
          {...registration}
          disabled={disabled}
          className="bg-transparent border text-xs border-none px-3 py-2 w-full focus:outline-none focus:ring-0 disabled:opacity-50"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {error ? (
        <span className="text-xs text-destructive">{error.message}</span>
      ) : null}
    </label>
  );
}
