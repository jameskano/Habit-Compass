import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { FormattedMessage, useIntl } from 'react-intl'

import { ChangePasswordSchema, type ChangePasswordValues } from '@/domain/auth/securityForms'
import { Button } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet'
import { AppError } from '@/shared/utils/appError'

import { PasswordInput } from './PasswordInput'
import type { PasswordFieldName } from './securityFormMessages'
import { useSendPasswordResetMutation, useUpdatePasswordMutation } from './useSecurityMutations'

type ChangePasswordSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ChangePasswordSheet = ({ open, onOpenChange }: ChangePasswordSheetProps) => {
  const intl = useIntl()
  const [status, setStatus] = useState<
    'idle' | 'complete' | 'password_recovery_sent' | 'error' | 'auth_error'
  >('idle')
  const [revealedFields, setRevealedFields] = useState<Record<PasswordFieldName, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  })
  const updatePassword = useUpdatePasswordMutation()
  const sendPasswordReset = useSendPasswordResetMutation()
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(ChangePasswordSchema) as Resolver<ChangePasswordValues>,
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset()
      setStatus('idle')
      setRevealedFields({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
      })
    }
  }, [form, open])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset()
      setStatus('idle')
    }
    onOpenChange(nextOpen)
  }

  const toggleReveal = (fieldName: PasswordFieldName) => {
    setRevealedFields((current) => ({
      ...current,
      [fieldName]: !current[fieldName],
    }))
  }

  const submit = form.handleSubmit((values) => {
    setStatus('idle')
    updatePassword.mutate(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      {
        onSuccess: () => {
          form.reset()
          setStatus('complete')
        },
        onError: (error) => {
          setStatus(
            error instanceof AppError && error.code === 'unauthorized' ? 'auth_error' : 'error',
          )
        },
      },
    )
  })

  const sendReset = () => {
    form.reset()
    setStatus('idle')
    sendPasswordReset.mutate(undefined, {
      onSuccess: () => setStatus('password_recovery_sent'),
      onError: () => setStatus('error'),
    })
  }

  const pending = updatePassword.isPending || sendPasswordReset.isPending

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="max-h-[92vh] animate-[habit-sheet-in_300ms_ease-out] overflow-y-auto motion-reduce:animate-none">
        <SheetTitle className="text-xl font-semibold tracking-tight">
          <FormattedMessage id="settings.security.changePassword.title" />
        </SheetTitle>

        <form noValidate className="mt-5 space-y-4" onSubmit={submit}>
          <PasswordInput
            autoComplete="current-password"
            errorMessage={form.formState.errors.currentPassword?.message}
            fieldName="currentPassword"
            labelId="settings.security.changePassword.currentPassword"
            register={form.register}
            reveal={revealedFields.currentPassword}
            toggleReveal={() => toggleReveal('currentPassword')}
            toggleRevealLabel={
              revealedFields.currentPassword
                ? intl.formatMessage({ id: 'settings.security.changePassword.hidePassword' })
                : intl.formatMessage({ id: 'settings.security.changePassword.showPassword' })
            }
          />
          <PasswordInput
            autoComplete="new-password"
            errorMessage={form.formState.errors.newPassword?.message}
            fieldName="newPassword"
            labelId="settings.security.changePassword.newPassword"
            register={form.register}
            reveal={revealedFields.newPassword}
            toggleReveal={() => toggleReveal('newPassword')}
            toggleRevealLabel={
              revealedFields.newPassword
                ? intl.formatMessage({ id: 'settings.security.changePassword.hidePassword' })
                : intl.formatMessage({ id: 'settings.security.changePassword.showPassword' })
            }
          />
          <PasswordInput
            autoComplete="new-password"
            errorMessage={form.formState.errors.confirmPassword?.message}
            fieldName="confirmPassword"
            labelId="settings.security.changePassword.confirmPassword"
            register={form.register}
            reveal={revealedFields.confirmPassword}
            toggleReveal={() => toggleReveal('confirmPassword')}
            toggleRevealLabel={
              revealedFields.confirmPassword
                ? intl.formatMessage({ id: 'settings.security.changePassword.hidePassword' })
                : intl.formatMessage({ id: 'settings.security.changePassword.showPassword' })
            }
          />

          <Button
            type="button"
            variant="ghost"
            className="h-auto px-0 text-sm font-medium text-primary hover:bg-transparent hover:underline"
            disabled={pending}
            onClick={sendReset}
          >
            <FormattedMessage id="settings.security.changePassword.forgotPassword" />
          </Button>

          {status !== 'idle' ? (
            <p
              className={
                status === 'complete' || status === 'password_recovery_sent'
                  ? 'rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300'
                  : 'rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive'
              }
            >
              <FormattedMessage id={`settings.security.changePassword.status.${status}`} />
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
              <FormattedMessage id="action.cancel" />
            </Button>
            <Button type="submit" disabled={pending}>
              <FormattedMessage id="settings.security.changePassword.update" />
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
