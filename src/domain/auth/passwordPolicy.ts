import { z } from 'zod'

export const authPasswordPolicy = {
  minLength: 12,
  maxLength: 64,
} as const

export const passwordPolicyErrorMessages = {
  tooLong: 'password_too_long',
  tooShort: 'password_too_short',
} as const

export const buildPasswordPolicySchema = () =>
  z
    .string()
    .min(1, 'required')
    .min(authPasswordPolicy.minLength, passwordPolicyErrorMessages.tooShort)
    .max(authPasswordPolicy.maxLength, passwordPolicyErrorMessages.tooLong)
