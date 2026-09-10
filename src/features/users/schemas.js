import { z } from 'zod'

import { REGISTERABLE_ROLES, REGISTRATION_FIELDS } from '@/constants/roles'

/**
 * A MIRROR OF THE BACKEND'S OWN REGEX, copied from src/utils/validators.js:
 *
 *   /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
 *
 * Deliberately the same pattern rather than a stricter or looser one. A looser
 * check here lets the user submit something the server then refuses; a
 * stricter one refuses an address the server would have taken. Either way the
 * form and the API disagree about the same string, which is the one outcome
 * worth avoiding.
 */
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

const CODE_FIELDS = [
  ['groupCode', 'Group'],
  ['branchCode', 'Branch'],
  ['regionCode', 'Region'],
]

/**
 * Registration.
 *
 * Every rule below was read from the backend's `register` in
 * services/userService.js, not assumed:
 *
 *   alwaysRequiredFields   firstName, lastName, birthday, mobileNumber,
 *                          employeeNo, email -- each checked with `!value`,
 *                          so an empty string fails and there is no format
 *                          rule beyond the email regex.
 *   registrationFields     the per-role group/branch/region matrix.
 *   code fields            positive whole numbers. "1.5", "0" and "-1" are
 *                          refused; a blank is skipped.
 *
 * ⚠️ NOTHING HERE VALIDATES A PASSWORD, because none is chosen. The backend
 * generates one and emails it once.
 *
 * The maximum lengths are this form's invention -- the API imposes none -- and
 * exist only to stop a paste of nonsense. Raise them freely.
 */
export const registerSchema = z
  .object({
    role: z
      .string()
      .refine((role) => REGISTERABLE_ROLES.includes(role), 'Choose your role.'),

    firstName: z.string().trim().min(1, 'First name is required.').max(60, 'That is too long.'),
    middleName: z.string().trim().max(60, 'That is too long.'),
    lastName: z.string().trim().min(1, 'Last name is required.').max(60, 'That is too long.'),
    suffix: z.string().trim().max(20, 'That is too long.'),

    // No format rule: the backend checks presence only, and a date input
    // already hands over YYYY-MM-DD.
    birthday: z
      .string()
      .min(1, 'Birthday is required.')
      // Ours, not the API's. A birthday after today is a typo every time --
      // usually a mistyped year -- and it is cheaper to catch here than to
      // find later in a record nobody re-reads.
      .refine((value) => value <= new Date().toISOString().slice(0, 10), {
        message: 'Birthday cannot be in the future.',
      }),

    // Left deliberately loose. The backend imposes no format, and Philippine
    // numbers are written 09171234567, +639171234567 and 0917 123 4567 by
    // different people -- a pattern here would refuse two of the three.
    mobileNumber: z
      .string()
      .trim()
      .min(1, 'Mobile number is required.')
      .max(20, 'That is too long.'),

    employeeNo: z
      .string()
      .trim()
      .min(1, 'Employee number is required.')
      .max(40, 'That is too long.'),

    email: z
      .string()
      .trim()
      .min(1, 'Email is required.')
      .max(254, 'That is too long.')
      .regex(EMAIL_PATTERN, 'Enter a valid email address'),

    // Held as strings because a <select> value is a string. They become
    // numbers in buildRegistrationPayload, which is also where the forbidden
    // ones are dropped.
    groupCode: z.string(),
    branchCode: z.string(),
    regionCode: z.string(),
  })
  .superRefine((values, ctx) => {
    const rule = REGISTRATION_FIELDS[values.role]
    if (!rule) return

    for (const [field, label] of CODE_FIELDS) {
      if (rule[field] === 'required' && !values[field]) {
        ctx.addIssue({
          code: 'custom',
          path: [field],
          message: `${label} is required for this role`,
        })
      }
    }

    // `forbidden` needs no issue: the form never shows those fields, and the
    // payload builder drops whatever is left in them. Raising an error for a
    // field the user cannot see would be an unfixable one.
  })

/**
 * Turn form values into the request body.
 *
 * WHAT YOU PICK AT REGISTRATION IS YOUR APPROVER'S SCOPE, NEVER YOUR OWN. The
 * group an Account Officer chooses is how the server finds the Area Sales Head
 * who approves them; their own branches arrive later, from an assign endpoint.
 *
 * Two things this has to get right:
 *
 * 1. A FORBIDDEN CODE IS OMITTED, not sent as null or "". The backend refuses
 *    with `${label} is not selected at registration for this role`. Its check
 *    is `rule[key] === 'forbidden' && fields[field]`, so a falsy value would
 *    slip through -- but omitting says what we mean and does not depend on
 *    that staying true.
 * 2. CODES GO AS NUMBERS. The backend accepts numeric strings and casts them,
 *    but requires a positive whole number: "1.5", "0" and "-1" are refused.
 *
 * Empty optional names are dropped too, so the body carries no blank strings.
 */
export function buildRegistrationPayload(values) {
  const rule = REGISTRATION_FIELDS[values.role] ?? {}

  const payload = {
    role: values.role,
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    birthday: values.birthday,
    mobileNumber: values.mobileNumber.trim(),
    employeeNo: values.employeeNo.trim(),
    email: values.email.trim(),
  }

  if (values.middleName?.trim()) payload.middleName = values.middleName.trim()
  if (values.suffix?.trim()) payload.suffix = values.suffix.trim()

  for (const [field] of CODE_FIELDS) {
    if (rule[field] === 'forbidden') continue
    const value = values[field]
    if (value === '' || value === null || value === undefined) continue
    payload[field] = Number(value)
  }

  return payload
}

/** Which of the three code fields this role should be shown. */
export function visibleCodeFields(role) {
  const rule = REGISTRATION_FIELDS[role]
  if (!rule) return { group: false, branch: false, region: false }

  return {
    group: rule.groupCode !== 'forbidden',
    branch: rule.branchCode !== 'forbidden',
    region: rule.regionCode !== 'forbidden',
    groupRequired: rule.groupCode === 'required',
    branchRequired: rule.branchCode === 'required',
    regionRequired: rule.regionCode === 'required',
  }
}
