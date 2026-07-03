import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { useForm, type Resolver } from 'react-hook-form'
import { FormattedMessage } from 'react-intl'

import {
  EmailCodeVerifySchema,
  type EmailCodeVerifyValues,
  normalizeOtpCode,
} from '@/domain/auth/authForms'
import { authRepository } from '@/integrations/repositories'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { unwrapResult } from '@/shared/utils/result'

import { AuthAlert, AuthStatus, FormField } from './AuthFormControls'
import { AuthShell, AuthTextLink } from './AuthShell'
import { getAuthFieldErrorMessageId } from './authMessages'
import { readPendingAuthState, savePendingAuthState } from './pendingAuthState'
import { useAuthFormError } from './useAuthFormError'
import { usePostAuthNavigation } from './usePostAuthNavigation'

export const EmailCodeVerifyPage = () => {
  const navigate = useNavigate()
  const postAuthNavigate = usePostAuthNavigation()
  const pendingAuth = readPendingAuthState()
  const email = pendingAuth?.flow === 'email-code' ? pendingAuth.email : null
  const { captureError, clearError, errorCode } = useAuthFormError()
  const form = useForm<EmailCodeVerifyValues>({
    resolver: zodResolver(EmailCodeVerifySchema) as Resolver<EmailCodeVerifyValues>,
    defaultValues: { code: '' },
  })

  const submit = async (values: EmailCodeVerifyValues) => {
    if (!email) {
      await navigate({ to: '/auth/email-code' })
      return
    }

    clearError()

    try {
      unwrapResult(await authRepository.verifyEmailCode({ email, token: normalizeOtpCode(values.code) }))
      await postAuthNavigate()
    } catch (error) {
      captureError(error)
    }
  }

  const resend = async () => {
    if (!email) {
      await navigate({ to: '/auth/email-code' })
      return
    }

    clearError()

    try {
      unwrapResult(await authRepository.requestEmailCode({ email }))
      savePendingAuthState({ email, flow: 'email-code' })
    } catch (error) {
      captureError(error)
    }
  }

  return (
    <AuthShell titleId="auth.emailCode.verifyTitle" descriptionId="auth.emailCode.verifyDescription">
      <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
        <AuthAlert errorCode={errorCode} />
        {email ? (
          <AuthStatus>
            <FormattedMessage id="auth.emailCode.sentTo" values={{ email }} />
          </AuthStatus>
        ) : null}
        <FormField
          errorId="email-code-code-error"
          errorMessageId={getAuthFieldErrorMessageId(form.formState.errors.code?.message)}
          labelId="auth.fields.otp"
        >
          <Input
            autoComplete="one-time-code"
            id="email-code-code"
            inputMode="numeric"
            maxLength={6}
            {...form.register('code', {
              onChange: (event) => {
                event.currentTarget.value = normalizeOtpCode(event.currentTarget.value)
              },
            })}
          />
        </FormField>
        <Button className="w-full" disabled={form.formState.isSubmitting || !email} type="submit">
          <FormattedMessage id="auth.emailCode.verify" />
        </Button>
      </form>
      <div className="flex flex-wrap justify-center gap-3 text-sm">
        <button className="font-medium text-primary" onClick={() => void resend()} type="button">
          <FormattedMessage id="auth.emailCode.resend" />
        </button>
        <AuthTextLink to="/auth/email-code">
          <FormattedMessage id="auth.emailCode.changeEmail" />
        </AuthTextLink>
        <AuthTextLink to="/auth/sign-in">
          <FormattedMessage id="auth.emailCode.passwordSignIn" />
        </AuthTextLink>
      </div>
    </AuthShell>
  )
}
