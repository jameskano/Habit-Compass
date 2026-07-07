import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type Resolver } from 'react-hook-form'
import { FormattedMessage } from 'react-intl'

import { ResetPasswordSchema, type ResetPasswordValues } from '@/domain/auth/authForms'
import { authRepository } from '@/integrations/repositories'
import { Button } from '@/shared/ui/button'
import { unwrapResult } from '@/shared/utils/result'

import { AuthAlert, FormField, PasswordInput } from './AuthFormControls'
import { AuthShell, AuthTextLink } from './AuthShell'
import { getAuthFieldErrorMessageId } from './authMessages'
import { useAuthFormError } from './useAuthFormError'
import { usePostAuthNavigation } from './usePostAuthNavigation'

export const ResetPasswordPage = () => {
  const postAuthNavigate = usePostAuthNavigation()
  const { captureError, clearError, errorCode } = useAuthFormError()
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(ResetPasswordSchema) as Resolver<ResetPasswordValues>,
    defaultValues: { confirmPassword: '', newPassword: '' },
  })

  const submit = async (values: ResetPasswordValues) => {
    clearError()

    try {
      unwrapResult(
        await authRepository.updateRecoveredPassword({ newPassword: values.newPassword }),
      )
      await postAuthNavigate()
    } catch (error) {
      captureError(error)
    }
  }

  return (
    <AuthShell titleId="auth.resetPassword.title" descriptionId="auth.resetPassword.description">
      <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
        <AuthAlert errorCode={errorCode} />
        <FormField
          errorId="reset-password-new-error"
          errorMessageId={getAuthFieldErrorMessageId(form.formState.errors.newPassword?.message)}
          labelId="auth.resetPassword.newPassword"
        >
          <PasswordInput
            autoComplete="new-password"
            id="reset-password-new"
            {...form.register('newPassword')}
          />
        </FormField>
        <FormField
          errorId="reset-password-confirm-error"
          errorMessageId={getAuthFieldErrorMessageId(
            form.formState.errors.confirmPassword?.message,
          )}
          labelId="auth.resetPassword.confirmPassword"
        >
          <PasswordInput
            autoComplete="new-password"
            id="reset-password-confirm"
            {...form.register('confirmPassword')}
          />
        </FormField>
        <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
          <FormattedMessage id="auth.resetPassword.submit" />
        </Button>
      </form>
      <p className="text-center text-sm">
        <AuthTextLink to="/auth/forgot-password">
          <FormattedMessage id="auth.resetPassword.requestAnother" />
        </AuthTextLink>
      </p>
    </AuthShell>
  )
}
