import { z } from 'zod'

const trimString = (value: unknown) => (typeof value === 'string' ? value.trim() : value)

const emailSchema = z.preprocess(trimString, z.email('invalid_email'))
const passwordSchema = z.string().min(8, 'password_too_short')

export const SignInPasswordSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'required'),
})

export const EmailCodeRequestSchema = z.object({
  email: emailSchema,
})

export const EmailCodeVerifySchema = z.object({
  code: z
    .string()
    .transform((value) => value.replace(/\D/g, '').slice(0, 6))
    .pipe(z.string().length(6, 'otp_length')),
})

export const SignUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  legalAccepted: z.literal(true, { error: 'legal_required' }),
})

export const ForgotPasswordSchema = z.object({
  email: emailSchema,
})

export const ResetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'required'),
  })
  .superRefine((value, context) => {
    if (value.newPassword && value.confirmPassword && value.newPassword !== value.confirmPassword) {
      context.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'mismatch',
      })
    }
  })

export const normalizeEmail = (email: string) => email.trim()
export const normalizeOtpCode = (code: string) => code.replace(/\D/g, '').slice(0, 6)

export type SignInPasswordValues = z.infer<typeof SignInPasswordSchema>
export type EmailCodeRequestValues = z.infer<typeof EmailCodeRequestSchema>
export type EmailCodeVerifyValues = z.infer<typeof EmailCodeVerifySchema>
export type SignUpValues = z.infer<typeof SignUpSchema>
export type ForgotPasswordValues = z.infer<typeof ForgotPasswordSchema>
export type ResetPasswordValues = z.infer<typeof ResetPasswordSchema>
