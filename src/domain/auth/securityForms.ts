import { z } from 'zod'

const trimString = (value: unknown) => (typeof value === 'string' ? value.trim() : value)

export const buildChangeEmailSchema = (currentEmail: string | null | undefined) =>
  z
    .object({
      newEmail: z.preprocess(trimString, z.email()),
    })
    .superRefine((value, context) => {
      if (currentEmail && value.newEmail.toLowerCase() === currentEmail.toLowerCase()) {
        context.addIssue({
          code: 'custom',
          path: ['newEmail'],
          message: 'unchanged',
        })
      }
    })

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'required'),
    newPassword: z.string().min(1, 'required'),
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

    if (value.currentPassword && value.newPassword && value.currentPassword === value.newPassword) {
      context.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: 'same_as_current',
      })
    }
  })

export type ChangeEmailValues = z.infer<ReturnType<typeof buildChangeEmailSchema>>
export type ChangePasswordValues = z.infer<typeof ChangePasswordSchema>
