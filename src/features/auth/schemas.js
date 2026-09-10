import { z } from 'zod'

/**
 * Shape only.
 *
 * These schemas catch what the API would answer 400 for, so the user is told
 * before a round trip. They do NOT decide whether the credentials are right,
 * whether the OTP is live, or whether the account is active -- those are the
 * server's answers, and its messages are shown verbatim.
 */

export const loginStep1Schema = z.object({
  /**
   * One field, three accepted things: Email, UserCode or EmployeeNo. The login
   * form passes through whatever was typed, so there is nothing to validate
   * beyond "not blank" -- rejecting anything that is not an email here would
   * refuse two of the three valid ways to sign in.
   *
   * Trimmed because a copy-pasted user code often carries a trailing space,
   * and the identifier has to match on step two exactly.
   */
  identifier: z.string().trim().min(1, 'Enter your email, user code, or employee number.'),
  password: z.string().min(1, 'Enter your password.'),
})

export const verifyOtpSchema = z.object({
  /**
   * No length or character rule here on purpose: the API documents the OTP's
   * lifetime (5 minutes) and attempt limit (5), but not its format. Guessing
   * six digits would refuse a valid code if it is ever anything else, and the
   * server checks it properly either way.
   */
  otp: z.string().trim().min(1, 'Enter the code sent to your email.'),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    // The backend's own minimum. Matching it here means the user is told
    // before the round trip rather than after.
    newPassword: z.string().min(8, 'New password must be at least 8 characters.'),
    confirmPassword: z.string().min(1, 'Re-enter the new password.'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'The two passwords do not match.',
    path: ['confirmPassword'],
  })
