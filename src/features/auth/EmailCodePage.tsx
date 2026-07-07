import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { useForm, type Resolver } from 'react-hook-form'
import { FormattedMessage } from 'react-intl'

import {
  EmailCodeRequestSchema,
  type EmailCodeRequestValues,
  normalizeEmail,
} from '@/domain/auth/authForms'
import { authRepository } from '@/integrations/repositories'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { unwrapResult } from '@/shared/utils/result'

import { AuthAlert, AuthStatus, FormField, GoogleButton, OAuthDivider } from './AuthFormControls'
import { AuthShell, AuthTextLink } from './AuthShell'
import { getAuthFieldErrorMessageId } from './authMessages'
import { getAuthCallbackUrl } from './authRedirects'
import { savePendingAuthState } from './pendingAuthState'
import { useAuthFormError } from './useAuthFormError'

export const EmailCodePage = () => {
  const navigate = useNavigate()
  const { captureError, clearError, errorCode } = useAuthFormError()
  const form = useForm<EmailCodeRequestValues>({
    resolver: zodResolver(EmailCodeRequestSchema) as Resolver<EmailCodeRequestValues>,
    defaultValues: { email: '' },
  })
  const pending = form.formState.isSubmitting

  const submit = async (values: EmailCodeRequestValues) => {
    clearError()
    const email = normalizeEmail(values.email)

    try {
      unwrapResult(await authRepository.requestEmailCode({ email }))
      savePendingAuthState({ email, flow: 'email-code' })
      await navigate({ to: '/auth/email-code/verify' })
    } catch (error) {
      captureError(error)
    }
  }

  const signInWithGoogle = async () => {
    clearError()

    try {
      unwrapResult(await authRepository.signInWithGoogle({ redirectTo: getAuthCallbackUrl() }))
    } catch (error) {
      captureError(error)
    }
  }

  return (
    <AuthShell
      footer={
        <FormattedMessage
          id="auth.signIn.passwordPrompt"
          values={{
            link: (chunks) => (
              <AuthTextLink key="password-sign-in-link" to="/auth/sign-in">
                {chunks}
              </AuthTextLink>
            ),
          }}
        />
      }
      titleId="auth.emailCode.title"
      descriptionId="auth.emailCode.description"
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
        <AuthAlert errorCode={errorCode} />
        <AuthStatus>
          <FormattedMessage id="auth.emailCode.neutral" />
        </AuthStatus>
        <FormField
          errorId="email-code-email-error"
          errorMessageId={getAuthFieldErrorMessageId(form.formState.errors.email?.message)}
          labelId="auth.fields.email"
        >
          <Input
            autoComplete="email"
            id="email-code-email"
            type="email"
            {...form.register('email')}
          />
        </FormField>
        <Button className="w-full" disabled={pending} type="submit">
          <FormattedMessage id={pending ? 'auth.emailCode.sending' : 'auth.emailCode.send'} />
        </Button>
      </form>
      <div className="space-y-3">
        <OAuthDivider />
        <GoogleButton disabled={pending} onClick={signInWithGoogle} />
        <p className="text-center text-sm text-muted-foreground">
          <FormattedMessage
            id="auth.emailCode.signUpPrompt"
            values={{
              link: (chunks) => (
                <AuthTextLink key="email-code-sign-up-link" to="/auth/sign-up">
                  {chunks}
                </AuthTextLink>
              ),
            }}
          />
        </p>
      </div>
    </AuthShell>
  )
}
