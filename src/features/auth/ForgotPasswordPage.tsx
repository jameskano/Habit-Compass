import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { FormattedMessage } from 'react-intl'

import {
  ForgotPasswordSchema,
  type ForgotPasswordValues,
  normalizeEmail,
} from '@/domain/auth/authForms'
import { authRepository } from '@/integrations/repositories'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { unwrapResult } from '@/shared/utils/result'

import { AuthAlert, AuthStatus, FormField } from './AuthFormControls'
import { AuthShell, AuthTextLink } from './AuthShell'
import { getAuthFieldErrorMessageId } from './authMessages'
import { getPasswordRecoveryUrl } from './authRedirects'
import { savePendingAuthState } from './pendingAuthState'
import { useAuthFormError } from './useAuthFormError'

export const ForgotPasswordPage = () => {
  const [sent, setSent] = useState(false)
  const { captureError, clearError, errorCode } = useAuthFormError()
  const form = useForm<ForgotPasswordValues>({
    defaultValues: { email: '' },
    resolver: zodResolver(ForgotPasswordSchema) as Resolver<ForgotPasswordValues>,
  })

  const submit = async (values: ForgotPasswordValues) => {
    clearError()
    const email = normalizeEmail(values.email)

    try {
      unwrapResult(
        await authRepository.requestPasswordReset({ email, redirectTo: getPasswordRecoveryUrl() }),
      )
      savePendingAuthState({ email, flow: 'recovery' })
      setSent(true)
    } catch (error) {
      captureError(error)
    }
  }

  return (
    <AuthShell titleId="auth.forgotPassword.title" descriptionId="auth.forgotPassword.description">
      <form className="space-y-4" noValidate onSubmit={form.handleSubmit(submit)}>
        <AuthAlert errorCode={errorCode} />
        {sent ? (
          <AuthStatus>
            <FormattedMessage id="auth.forgotPassword.neutral" />
          </AuthStatus>
        ) : null}
        <FormField
          errorId="forgot-password-email-error"
          errorMessageId={getAuthFieldErrorMessageId(form.formState.errors.email?.message)}
          labelId="auth.fields.email"
        >
          <Input
            autoComplete="email"
            id="forgot-password-email"
            type="email"
            {...form.register('email')}
          />
        </FormField>
        <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
          <FormattedMessage id="auth.forgotPassword.submit" />
        </Button>
      </form>
      <p className="text-center text-sm">
        <AuthTextLink to="/auth/sign-in">
          <FormattedMessage id="auth.forgotPassword.back" />
        </AuthTextLink>
      </p>
    </AuthShell>
  )
}
