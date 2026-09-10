import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, useNavigate } from 'react-router'

import { paths } from '@/routes/paths'

import { LoginForm } from '../components/LoginForm'
import { useLoginStep1 } from '../hooks'
import { loginStep1Schema } from '../schemas'

/**
 * Step one of two: prove the password, and an OTP is emailed.
 *
 * No cookie is set here. Nothing is signed in until the code is verified on
 * the next route.
 */
export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // Where the user was heading when they were bounced to login. Carried
  // forward through the OTP step so they land there instead of the home page.
  const from = location.state?.from

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginStep1Schema),
    defaultValues: { identifier: '', password: '' },
  })

  const loginMutation = useLoginStep1()

  const onSubmit = handleSubmit((values) => {
    // `mutate` rather than `mutateAsync`: the failure is an answer to show,
    // not an exception to handle, and it lands in loginMutation.error.
    loginMutation.mutate(values, {
      onSuccess: () => navigate(paths.loginVerify, { state: { from } }),
    })
  })

  return (
    <LoginForm
      register={register}
      errors={errors}
      serverError={loginMutation.error?.message ?? null}
      isPending={loginMutation.isPending}
      onSubmit={onSubmit}
    />
  )
}
