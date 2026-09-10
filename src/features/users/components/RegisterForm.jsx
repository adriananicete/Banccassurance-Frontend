/**
 * ============================================================================
 *  THIS FILE IS YOURS. Built to match LoginForm's pattern -- restyle freely.
 * ============================================================================
 *
 * Presentational. `pages/RegisterPage.jsx` supplies every prop, fetches every
 * dropdown, decides which fields this role may send, and owns the step.
 *
 * The rows reuse LoginForm's shape exactly: a bordered row that stretches its
 * children to full height, an icon wrapper that centres its own icon, and a
 * borderless text-xs input. `Field` and `SelectField` at the bottom hold that
 * markup once so a restyle is one edit rather than eleven.
 *
 * WIDTH: max-w-md rather than LoginForm's max-w-sm. 64px wider, which is what
 * two columns need -- max-w-sm minus px-14 leaves 272px, so a column would be
 * 136px. Keeping each step to two or three rows is what stops the page from
 * scrolling, which was the point of splitting it up.
 *
 * The props contract:
 *
 *   step          { id, title } for the step being shown. `id` is one of
 *                 'identity', 'contact', 'location'.
 *   stepNumber / stepCount    1-based, for the counter.
 *   isFirstStep / isLastStep
 *   onBack        Previous step. Absent on the first.
 *   onSubmit      The form's own handler. It advances on every step except
 *                 the last, where it submits -- so Enter in a text field does
 *                 the same thing the button does.
 *
 *   register / errors / isPending / serverError
 *                 As in LoginForm. `serverError` is the backend's own
 *                 wording -- show it as given. Registration has several
 *                 distinct 400s and 409s and only the message separates them.
 *
 *   roleOptions   [{ value, label }] -- the FOUR roles that belong to the
 *                 company chosen on the previous screen, not all eight.
 *                 SUPERADMIN is never among them; it is seeded, never
 *                 registered, and answers 400.
 *
 *   tenantLabel     "Landbank" or "PhilLife".
 *   changeTenantPath  Back to the company chooser.
 *
 *   codeFields    { group, branch, region, groupRequired, ... } -- which of
 *                 the three location fields this role may send. SENDING A
 *                 FORBIDDEN ONE IS A 400, so a field shown for the wrong role
 *                 is not cosmetic. When all three are false the container
 *                 drops the location step entirely and this never renders it.
 *
 *   regions / groups / branches      Dropdown rows, already fetched.
 *   isLoadingGroups / isLoadingBranches
 *   hasGroupSelected                 The branch select stays disabled until a
 *                                    group is chosen -- see the note on it.
 *
 *   emailTaken    true / false / null. A courtesy check; the submit answers
 *                 409 for a taken address regardless.
 *   onEmailBlur   Fires the check.
 *
 *   birthdayMin / birthdayMax
 *                 YYYY-MM-DD bounds for the date picker, from the age rules in
 *                 schemas.js. They only grey out dates in the picker -- a typed
 *                 or pasted date ignores them, so the schema checks again.
 *
 * WHAT THE USER PICKS HERE IS THEIR APPROVER'S SCOPE, NOT THEIR OWN. An
 * Account Officer choosing a group is naming whose queue they land in; the
 * branches they will cover are assigned afterwards by that Area Sales Head.
 * Wording that says "your group" would be wrong.
 */
import { FiUser } from "react-icons/fi";
import {
  LuArrowLeft,
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
  step,
  stepNumber,
  stepCount,
  isFirstStep,
  isLastStep,
  onBack,
  onSubmit,
  register,
  errors,
  isPending,
  serverError,
  roleOptions,
  tenantLabel,
  changeTenantPath,
  codeFields,
  regions,
  groups,
  branches,
  isLoadingGroups,
  isLoadingBranches,
  hasGroupSelected,
  emailTaken,
  onEmailBlur,
  birthdayMin,
  birthdayMax,
}) {
  return (
    <form
      onSubmit={onSubmit}
      // gap-4 rather than LoginForm's gap-6, and py-5 rather than py-6. Five
      // gaps at 8px less is 40px, which together with the reserved message
      // lines is what keeps the tallest step inside a 768p laptop viewport.
      className="flex w-full max-w-md flex-col gap-4 px-10 py-5"
    >
      <div className="w-full flex flex-col justify-center items-center gap-2">
        <div className="bg-[#ededed] p-2 w-14 flex justify-center items-center rounded-full shadow-inner">
          <div className="bg-white border p-2 w-full text-white rounded-full shadow-accent">
            <LuUserPlus size={20} color="#000" />
          </div>
        </div>

        <div className="flex flex-col justify-center items-center">
          <h1 className="text-lg font-semibold">{step.title}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {tenantLabel} · Step {stepNumber} of {stepCount}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {Array.from({ length: stepCount }, (_, index) => (
            <span
              key={index}
              className={
                index < stepNumber
                  ? "h-1 w-8 rounded-full bg-indigo-950"
                  : "h-1 w-8 rounded-full bg-neutral-300"
              }
            />
          ))}
        </div>
      </div>

      {serverError ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive"
        >
          {serverError}
        </p>
      ) : null}

      {step.id === "identity" ? (
        <div className="grid gap-4">
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
          </div>
        </div>
      ) : null}

      {step.id === "contact" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Birthday"
            required
            type="date"
            icon={<LuCalendar />}
            error={errors.birthday}
            registration={register("birthday")}
            // Greys out the impossible dates in the native picker. The schema
            // still checks the same bounds -- these attributes only constrain
            // the picker, and a typed or pasted date walks straight past them.
            min={birthdayMin}
            max={birthdayMax}
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
                ? "Already registered."
                : emailTaken === false
                  ? "Available."
                  : null
            }
            hintTone={emailTaken === true ? "bad" : "good"}
          />
        </div>
      ) : null}

      {step.id === "location" ? (
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

          <p className="text-xs text-muted-foreground sm:col-span-2">
            This is how we find the person who approves you — not the area you
            will cover. That is assigned after your account is approved.
          </p>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        {!isFirstStep ? (
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer rounded-sm border border-input px-3 py-2 text-sm flex justify-center items-center gap-2"
          >
            <LuArrowLeft />
            Back
          </button>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="cursor-pointer flex-1 rounded-sm bg-indigo-950 px-3 py-2 text-sm text-primary-foreground disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {isLastStep ? <LuUserPlus /> : null}
          {isLastStep ? (isPending ? "Submitting…" : "Create account") : "Next"}
        </button>
      </div>

      {/* One line rather than two: every line here is height the tallest step
          cannot spare. */}
      <div className="flex justify-center items-center gap-3 text-xs">
        <Link to={changeTenantPath} className="font-bold hover:text-[#157d03]">
          Change company
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link to={paths.login} className="font-bold hover:text-[#157d03]">
          Sign In
        </Link>
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
      <FieldMessage error={error} hint={hint} hintTone={hintTone} />
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
      <FieldMessage error={error} />
    </label>
  );
}

/**
 * The line under a field, and the reason the page does not jump.
 *
 * It is ALWAYS RENDERED, holding a non-breaking space when there is nothing to
 * say. Showing it only on error makes every field a row that grows by one line
 * the moment it fails -- four failing fields add about 64px, which is exactly
 * what pushes the card past the viewport and brings up the scrollbar.
 *
 * Reserved, the card is the same height whether the form is untouched or every
 * field is wrong. `leading-4` fixes the line box so the reservation is exact.
 *
 * ⚠️ THIS ONLY HOLDS WHILE MESSAGES FIT ONE LINE. A column here is about
 * 176px, so roughly forty characters at text-xs. A longer message wraps and
 * the row grows again -- which is why the messages in schemas.js are short.
 * Keep them that way, or reserve two lines here instead.
 */
function FieldMessage({ error, hint, hintTone = "good" }) {
  const message = error?.message ?? hint ?? null;

  return (
    <span
      className={
        error || hintTone === "bad"
          ? "text-xs leading-4 min-h-4 text-destructive"
          : "text-xs leading-4 min-h-4 text-muted-foreground"
      }
    >
      {message ?? " "}
    </span>
  );
}
