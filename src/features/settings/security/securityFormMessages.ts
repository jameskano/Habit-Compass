import type { ChangePasswordValues } from '@/domain/auth/securityForms'

export type PasswordFieldName = keyof ChangePasswordValues

export const getEmailErrorId = (message?: string) => {
  if (message === 'unchanged') {
    return 'settings.security.changeEmail.error.unchanged'
  }

  return 'settings.security.changeEmail.error.invalid'
}

export const getPasswordErrorId = (field: PasswordFieldName, message?: string) => {
  if (message === 'mismatch') {
    return 'settings.security.changePassword.error.mismatch'
  }

  if (message === 'same_as_current') {
    return 'settings.security.changePassword.error.sameAsCurrent'
  }

  return field === 'currentPassword'
    ? 'settings.security.changePassword.error.currentRequired'
    : 'settings.security.changePassword.error.newRequired'
}
