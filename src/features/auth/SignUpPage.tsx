import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { useForm, type Resolver } from 'react-hook-form'
import { FormattedMessage, useIntl } from 'react-intl'

import { SignUpSchema, type SignUpValues, normalizeEmail } from '@/domain/auth/authForms'
import { authRepository } from '@/integrations/repositories'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Input } from '@/shared/ui/input'
import { unwrapResult } from '@/shared/utils/result'

import { AuthAlert, FormField, GoogleButton, OAuthDivider, PasswordInput } from './AuthFormControls'
import { AuthShell, AuthTextLink } from './AuthShell'
import { getAuthFieldErrorMessageId } from './authMessages'
import { getAuthCallbackUrl } from './authRedirects'
import { savePendingAuthState } from './pendingAuthState'
import { useAuthFormError } from './useAuthFormError'

export const SignUpPage = () => {
  const navigate = useNavigate()
  const intl = useIntl()
  const locale: 'en' | 'es' = intl.locale.startsWith('es') ? 'es' : 'en'
  const { captureError, clearError, errorCode } = useAuthFormError()
  const form = useForm<SignUpValues>({
    defaultValues: { email: '', password: '', legalAccepted: false as true },
    resolver: zodResolver(SignUpSchema) as Resolver<SignUpValues>,
  })
  const pending = form.formState.isSubmitting

  const prepareLegalIntent = async () => {
    const versions = unwrapResult(await authRepository.getCurrentLegalVersions())
    return { ...versions, locale }
  }

  const submit = async (values: SignUpValues) => {
    clearError()
    const email = normalizeEmail(values.email)

    try {
      const legalIntent = await prepareLegalIntent()
      savePendingAuthState({ email, flow: 'signup', legalIntent })
      unwrapResult(
        await authRepository.signUpWithPassword({
          email,
          emailRedirectTo: getAuthCallbackUrl('signup'),
          password: values.password,
        }),
      )
      await navigate({ to: '/auth/verify-email' })
    } catch (error) {
      captureError(error)
    }
  }

  const signUpWithGoogle = async () => {
    const isValid = await form.trigger(['legalAccepted'])

    if (!isValid) {
      return
    }

    clearError()

    try {
      const legalIntent = await prepareLegalIntent()
      savePendingAuthState({
        email: normalizeEmail(form.getValues('email')),
        flow: 'signup',
        legalIntent,
        oauthReturnTo: '/auth/sign-up',
      })
      unwrapResult(
        await authRepository.signInWithGoogle({ redirectTo: getAuthCallbackUrl('signup') }),
      )
    } catch (error) {
      captureError(error)
    }
  }

  return (
    <AuthShell
      descriptionId="auth.signUp.description"
      footer={
        <FormattedMessage
          id="auth.signUp.signInPrompt"
          values={{
            link: (chunks) => (
              <AuthTextLink key="sign-up-sign-in-link" to="/auth/sign-in">
                {chunks}
              </AuthTextLink>
            ),
          }}
        />
      }
      titleId="auth.signUp.title"
    >
      <form className="space-y-4" noValidate onSubmit={form.handleSubmit(submit)}>
        <AuthAlert errorCode={errorCode} />
        <FormField
          errorId="sign-up-email-error"
          errorMessageId={getAuthFieldErrorMessageId(form.formState.errors.email?.message)}
          labelId="auth.fields.email"
        >
          <Input autoComplete="email" id="sign-up-email" type="email" {...form.register('email')} />
        </FormField>
        <FormField
          errorId="sign-up-password-error"
          errorMessageId={getAuthFieldErrorMessageId(form.formState.errors.password?.message)}
          labelId="auth.fields.password"
        >
          <PasswordInput
            autoComplete="new-password"
            id="sign-up-password"
            {...form.register('password')}
          />
        </FormField>
        <p className="text-sm text-muted-foreground">
          <FormattedMessage id="auth.password.policyHint" />
        </p>
        <label className="flex gap-3 text-sm leading-6">
          <Checkbox {...form.register('legalAccepted')} aria-describedby="sign-up-legal-error" />
          <span>
            <FormattedMessage
              id="auth.signUp.legal"
              values={{
                privacy: (chunks) => (
                  <AuthTextLink key="sign-up-privacy-link" to="/legal/privacy-policy">
                    {chunks}
                  </AuthTextLink>
                ),
                terms: (chunks) => (
                  <AuthTextLink key="sign-up-terms-link" to="/legal/terms">
                    {chunks}
                  </AuthTextLink>
                ),
              }}
            />
          </span>
        </label>
        {form.formState.errors.legalAccepted ? (
          <p className="text-sm text-destructive" id="sign-up-legal-error">
            <FormattedMessage id="auth.validation.legalRequired" />
          </p>
        ) : null}
        <Button className="w-full" disabled={pending} type="submit">
          <FormattedMessage id={pending ? 'auth.signUp.submitting' : 'auth.signUp.submit'} />
        </Button>
      </form>
      <div className="space-y-3">
        <OAuthDivider />
        <GoogleButton disabled={pending} onClick={signUpWithGoogle} />
      </div>
    </AuthShell>
  )
}
