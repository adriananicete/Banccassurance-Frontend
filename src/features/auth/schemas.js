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
   * beyond a length ceiling -- rejecting anything that is not an email here
   * would refuse two of the three valid ways to sign in.
   *
   * 40 is Adrian's decision, and it is a ceiling this form invents -- the API
   * imposes none. It clears a user code (`USR-STF-00001`, 13) with room to
   * spare, and it clears most work addresses.
   *
   * ⚠️ It does NOT clear every email. `maria.cristina.delacruz@phillife.com.ph`
   * is 39 characters, so the margin is one or two characters, not many. An
   * address past 40 cannot be typed here at all, and the input stops silently
   * -- the user sees their own address refuse to finish. It was 254, the RFC
   * maximum, for that reason. If someone reports being unable to enter their
   * email, this number is why.
   *
   * Trimmed because a copy-pasted user code often carries a trailing space,
   * and the identifier has to match on step two exactly.
   */
  identifier: z
    .string()
    .trim()
    .min(1, 'Enter your email, user code, or employee number.')
    .max(40, 'That is too long to be an email, user code, or employee number.'),

  /**
   * No minimum. `loginStep1` imposes none either -- it is a bare
   * `bcrypt.compare` against whatever hash the account holds -- and a login
   * form that refuses a short password refuses the attempt rather than the
   * password, locking out any account whose password predates a rule.
   *
   * The 30 is Adrian's decision. It clears everything we know of today:
   * seeded accounts use `password123` (11) and registration generates
   * `crypto.randomBytes(12).toString('base64url')` (16).
   *
   * ⚠️ It is a ceiling this form invents, not one the API has.
   * `changePassword` enforces a minimum of 8 and NO maximum, so an account
   * that sets a 35-character password there can no longer be typed into this
   * form -- the input would silently stop at 30 and the server would answer
   * "Invalid credentials" with nothing to explain it. Whatever cap the change
   * -password screen ends up with has to match this one.
   */
  password: z
    .string()
    .min(1, 'Enter your password.')
    .max(30, 'Password must be 30 characters or fewer.'),
})

export const verifyOtpSchema = z.object({
  /**
   * Exactly six digits.
   *
   * This was previously left unconstrained because BACKEND.md documents the
   * code's lifetime and attempt limit but not its shape. It is now read from
   * the backend source rather than assumed:
   *
   *   const generateOtp = () => crypto.randomInt(100000, 1000000).toString()
   *
   * That is an integer from 100000 to 999999 -- always six digits, never a
   * leading zero -- and it is checked with `!==`, a strict string comparison
   * with no trimming. So six digits is the whole rule.
   *
   * Worth catching here rather than sending: a short code costs the user one
   * of only five attempts, and the fifth discards the code entirely.
   */
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter all 6 digits of the code.'),
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
