import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useParams } from 'react-router'

import {
  ROLE_LABELS,
  TENANT_LABELS,
  TENANT_SLUGS,
  registerableRolesForTenant,
} from '@/constants/roles'
import { useBranches, useGroups, useRegions } from '@/features/lookups/hooks'
import { manilaDayYearsAgo } from '@/lib/datetime'
import { paths } from '@/routes/paths'

import { RegisterForm } from '../components/RegisterForm'
import { RegisterSuccess } from '../components/RegisterSuccess'
import { useCheckEmail, useRegisterUser } from '../hooks'
import {
  MAXIMUM_AGE,
  MINIMUM_AGE,
  buildRegistrationPayload,
  registerSchema,
  visibleCodeFields,
} from '../schemas'

/**
 * The wizard.
 *
 * `fields` is what `trigger()` validates before letting the user move on, so
 * a step never advances over its own errors and never shows errors belonging
 * to a step the user has not reached.
 *
 * ⚠️ THE LOCATION STEP IS NOT ALWAYS THERE. Three of the eight roles --
 * Regional Sales Head, Sector Head and Department Head -- send no group,
 * branch or region at all, so for them registration is two steps and the
 * counter says so. A step with no fields is a click that does nothing.
 */
const STEPS = [
  {
    id: 'identity',
    title: 'Role and name',
    fields: ['role', 'firstName', 'middleName', 'lastName', 'suffix'],
  },
  {
    id: 'contact',
    title: 'Contact details',
    fields: ['birthday', 'mobileNumber', 'employeeNo', 'email'],
  },
  {
    id: 'location',
    title: 'Where you work',
    fields: ['groupCode', 'branchCode', 'regionCode'],
  },
]

const EMPTY_FORM = {
  role: '',
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: '',
  birthday: '',
  mobileNumber: '',
  employeeNo: '',
  email: '',
  groupCode: '',
  branchCode: '',
  regionCode: '',
}

/**
 * Step two of registration: the form itself, for one company.
 *
 * The company arrives in the URL rather than in state so the back button
 * returns to the chooser and a half-filled form is not lost to a stray
 * navigation. It also means only four roles are offered instead of eight --
 * the other four belong to the other company and could never be right.
 *
 * No session exists here, which is why the three lookups it uses are the
 * unauthenticated ones. `/lookups/plans` needs a cookie and plays no part.
 */
export function RegisterPage() {
  const { tenant: tenantSlug } = useParams()
  const tenant = TENANT_SLUGS[tenantSlug]

  const [stepIndex, setStepIndex] = useState(0)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: EMPTY_FORM,
  })

  // `useWatch` rather than the `watch()` returned by useForm: that one hands
  // back a fresh function on every render, which React Compiler cannot
  // memoize safely, so it skips compiling the whole component.
  const role = useWatch({ control, name: 'role' })
  const groupCode = useWatch({ control, name: 'groupCode' })

  const registerMutation = useRegisterUser()
  const { reset: clearServerError } = registerMutation

  /** Which of group / branch / region this role may send. */
  const codeFields = visibleCodeFields(role)

  // Fetched only when the chosen role can actually send them, so picking
  // "Regional Sales Head" -- which sends none of the three -- makes no
  // reference-data requests at all.
  const regionsQuery = useRegions({ enabled: codeFields.region })
  const groupsQuery = useGroups({ enabled: codeFields.group })
  const branchesQuery = useBranches(codeFields.branch ? groupCode : null)

  /**
   * Changing role changes which codes are legal, and a value left behind in a
   * now-forbidden field would be sent and refused with
   * "<Field> is not selected at registration for this role" -- an error about
   * a field the user can no longer see.
   *
   * buildRegistrationPayload drops them as well. This clears them so the
   * dropdowns do not show a stale selection either.
   */
  useEffect(() => {
    setValue('groupCode', '')
    setValue('branchCode', '')
    setValue('regionCode', '')

    /**
     * A server error describes the payload that was SENT, so changing the
     * role makes it stale -- and stale here is actively wrong.
     *
     * The case that showed it: registering as Department Head answers 409,
     * "The Department Head role is limited to 1 account…". Switching to
     * Account Officer left that message on screen, still naming a role the
     * user had already abandoned, with nothing to say it no longer applied.
     */
    clearServerError()
  }, [role, setValue, clearServerError])

  /** A branch belongs to one group, so changing the group invalidates it. */
  useEffect(() => {
    setValue('branchCode', '')
  }, [groupCode, setValue])

  /**
   * The email check runs on blur rather than on every keystroke: the endpoint
   * is rate-limited by address, and a half-typed address is not a question
   * worth asking.
   */
  const [emailToCheck, setEmailToCheck] = useState('')
  const emailQuery = useCheckEmail(emailToCheck)

  /**
   * Drop the location step when this role sends none of the three codes.
   * Until a role is picked, `codeFields` is all false -- so the counter reads
   * "of 2" on the first step and becomes "of 3" once a role that needs a
   * location is chosen. That is honest rather than tidy: promising a third
   * step and then not having one is worse than the counter moving.
   */
  const needsLocation = codeFields.group || codeFields.branch || codeFields.region
  const activeSteps = needsLocation ? STEPS : STEPS.filter((s) => s.id !== 'location')

  /**
   * Clamped on read rather than corrected in state. Going back to step 1 and
   * switching to a role with no location shortens the wizard underneath the
   * current index, and clamping here handles that without a second render.
   */
  const safeIndex = Math.min(stepIndex, activeSteps.length - 1)
  const step = activeSteps[safeIndex]
  const isLastStep = safeIndex === activeSteps.length - 1

  const submitAll = handleSubmit((values) => {
    registerMutation.mutate(buildRegistrationPayload(values))
  })

  /**
   * One handler for the form, so pressing Enter in a text field does exactly
   * what the button does. Without this, Enter on step 1 would run the whole
   * schema and light up errors on fields the user has not reached.
   */
  const onSubmit = async (event) => {
    event.preventDefault()

    if (isLastStep) {
      submitAll(event)
      return
    }

    // Validate only this step's fields. `trigger` runs the whole schema but
    // reports on the names given, which is what keeps later steps quiet.
    const isStepValid = await trigger(step.fields)
    if (isStepValid) setStepIndex(safeIndex + 1)
  }

  // An unknown slug -- a typo, or an old link -- goes back to the chooser
  // rather than rendering a form with an empty role list and no way forward.
  if (!tenant) {
    return <Navigate to={paths.register} replace />
  }

  if (registerMutation.isSuccess) {
    return (
      <RegisterSuccess
        userCode={registerMutation.data?.userCode}
        message={registerMutation.data?.message}
      />
    )
  }

  const roleOptions = registerableRolesForTenant(tenant).map((value) => ({
    value,
    label: ROLE_LABELS[value],
  }))

  return (
    <RegisterForm
      step={step}
      stepNumber={safeIndex + 1}
      stepCount={activeSteps.length}
      isFirstStep={safeIndex === 0}
      isLastStep={isLastStep}
      // Going back is the user starting to fix something, so the error from
      // the last attempt stops being true the moment they do.
      onBack={() => {
        clearServerError()
        setStepIndex(Math.max(0, safeIndex - 1))
      }}
      register={register}
      errors={errors}
      onSubmit={onSubmit}
      isPending={registerMutation.isPending}
      serverError={registerMutation.error?.message ?? null}
      roleOptions={roleOptions}
      tenantLabel={TENANT_LABELS[tenant]}
      changeTenantPath={paths.register}
      codeFields={codeFields}
      regions={regionsQuery.data ?? []}
      groups={groupsQuery.data ?? []}
      branches={branchesQuery.data ?? []}
      isLoadingGroups={groupsQuery.isLoading}
      isLoadingBranches={branchesQuery.isLoading}
      hasGroupSelected={Boolean(groupCode)}
      // undefined while the query has not run, so the form can tell
      // "not asked" from "available".
      emailTaken={emailQuery.data ?? null}
      onEmailBlur={(event) => setEmailToCheck(event.target.value.trim())}
      // The picker's own bounds. `min` is a day more permissive than the
      // schema at the far end, which is the safe direction: the schema is the
      // one that decides, and a native constraint that refuses first would
      // give no message at all.
      birthdayMin={manilaDayYearsAgo(MAXIMUM_AGE + 1)}
      birthdayMax={manilaDayYearsAgo(MINIMUM_AGE)}
    />
  )
}
