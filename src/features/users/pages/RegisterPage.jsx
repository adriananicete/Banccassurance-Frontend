import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { REGISTERABLE_ROLES, ROLE_LABELS } from '@/constants/roles'
import { useBranches, useGroups, useRegions } from '@/features/lookups/hooks'

import { RegisterForm } from '../components/RegisterForm'
import { RegisterSuccess } from '../components/RegisterSuccess'
import { useCheckEmail, useRegisterUser } from '../hooks'
import { buildRegistrationPayload, registerSchema, visibleCodeFields } from '../schemas'

const ROLE_OPTIONS = REGISTERABLE_ROLES.map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}))

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
 * Public registration. No session exists here, which is why the three lookups
 * it uses are the unauthenticated ones -- `/lookups/plans` needs a cookie and
 * plays no part.
 */
export function RegisterPage() {
  const {
    register,
    handleSubmit,
    control,
    setValue,
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
  }, [role, setValue])

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

  const registerMutation = useRegisterUser()

  const onSubmit = handleSubmit((values) => {
    registerMutation.mutate(buildRegistrationPayload(values))
  })

  if (registerMutation.isSuccess) {
    return (
      <RegisterSuccess
        userCode={registerMutation.data?.userCode}
        message={registerMutation.data?.message}
      />
    )
  }

  return (
    <RegisterForm
      register={register}
      errors={errors}
      onSubmit={onSubmit}
      isPending={registerMutation.isPending}
      serverError={registerMutation.error?.message ?? null}
      roleOptions={ROLE_OPTIONS}
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
    />
  )
}
