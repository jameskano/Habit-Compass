import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { useForm, type Resolver } from 'react-hook-form'
import { FormattedMessage } from 'react-intl'

import {
  SignInPasswordSchema,
  type SignInPasswordValues,
  normalizeEmail,
} from '@/domain/auth/authForms'
import { authRepository } from '@/integrations/repositories'
import { Button } from '@/shared/ui/button'
import { unwrapResult } from '@/shared/utils/result'

import { AuthAlert, FormField, GoogleButton, OAuthDivider, PasswordInput } from './AuthFormControls'
import { AuthShell, AuthTextLink } from './AuthShell'
import { getAuthFieldErrorMessageId } from './authMessages'
import { getAuthCallbackUrl } from './authRedirects'
import { useAuthFormError } from './useAuthFormError'
import { usePostAuthNavigation } from './usePostAuthNavigation'

export const SignInPage = () => {
  const navigate = useNavigate()
  const postAuthNavigate = usePostAuthNavigation()
  const { captureError, clearError, errorCode } = useAuthFormError()
  const form = useForm<SignInPasswordValues>({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(SignInPasswordSchema) as Resolver<SignInPasswordValues>,
  })
  const pending = form.formState.isSubmitting

  const submit = async (values: SignInPasswordValues) => {
    clearError()

    try {
      unwrapResult(
        await authRepository.signInWithPassword({
          email: normalizeEmail(values.email),
          password: values.password,
        }),
      )
      await postAuthNavigate()
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
          id="auth.signIn.signUpPrompt"
          values={{
            link: (chunks) => (
              <AuthTextLink key="sign-in-sign-up-link" to="/auth/sign-up">
                {chunks}
              </AuthTextLink>
            ),
          }}
        />
      }
      titleId="auth.signIn.title"
    >
      <form className="space-y-4" noValidate onSubmit={form.handleSubmit(submit)}>
        <AuthAlert errorCode={errorCode} />
        <FormField
          errorId="sign-in-email-error"
          errorMessageId={getAuthFieldErrorMessageId(form.formState.errors.email?.message)}
          labelId="auth.fields.email"
        >
          <input
            autoComplete="email"
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            id="sign-in-email"
            type="email"
            {...form.register('email')}
          />
        </FormField>
        <FormField
          errorId="sign-in-password-error"
          errorMessageId={getAuthFieldErrorMessageId(form.formState.errors.password?.message)}
          labelId="auth.fields.password"
        >
          <PasswordInput
            autoComplete="current-password"
            id="sign-in-password"
            {...form.register('password')}
          />
        </FormField>
        <div className="flex justify-end">
          <AuthTextLink to="/auth/forgot-password">
            <FormattedMessage id="auth.signIn.forgotPassword" />
          </AuthTextLink>
        </div>
        <Button className="w-full" disabled={pending} type="submit">
          <FormattedMessage id={pending ? 'auth.signIn.submitting' : 'auth.signIn.submit'} />
        </Button>
      </form>
      <div className="space-y-3">
        <Button
          className="w-full"
          onClick={() => void navigate({ to: '/auth/email-code' })}
          type="button"
          variant="ghost"
        >
          <FormattedMessage id="auth.signIn.emailCode" />
        </Button>
        <OAuthDivider />
        <GoogleButton disabled={pending} onClick={signInWithGoogle} />
      </div>
    </AuthShell>
  )
}
