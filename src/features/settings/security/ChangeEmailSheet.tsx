import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { FormattedMessage, useIntl } from 'react-intl'

import { buildChangeEmailSchema, type ChangeEmailValues } from '@/domain/auth/securityForms'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/shared/ui/sheet'

import { getEmailErrorId } from './securityFormMessages'
import { useRequestEmailChangeMutation } from './useSecurityMutations'

type ChangeEmailSheetProps = {
  currentEmail: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ChangeEmailSheet = ({ currentEmail, open, onOpenChange }: ChangeEmailSheetProps) => {
  const intl = useIntl()
  const [status, setStatus] = useState<'idle' | 'pending_confirmation' | 'error'>('idle')
  const requestEmailChange = useRequestEmailChangeMutation()
  const schema = useMemo(() => buildChangeEmailSchema(currentEmail), [currentEmail])
  const form = useForm<ChangeEmailValues>({
    resolver: zodResolver(schema) as Resolver<ChangeEmailValues>,
    defaultValues: {
      newEmail: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({ newEmail: '' })
      setStatus('idle')
    }
  }, [form, open])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset({ newEmail: '' })
      setStatus('idle')
    }
    onOpenChange(nextOpen)
  }

  const submit = form.handleSubmit((values) => {
    setStatus('idle')
    requestEmailChange.mutate(
      { newEmail: values.newEmail },
      {
        onSuccess: () => {
          form.reset({ newEmail: '' })
          setStatus('pending_confirmation')
        },
        onError: () => setStatus('error'),
      },
    )
  })

  const newEmailError = form.formState.errors.newEmail
  const canSubmit = Boolean(currentEmail) && !requestEmailChange.isPending

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="max-h-[92vh] animate-[habit-sheet-in_300ms_ease-out] overflow-y-auto motion-reduce:animate-none">
        <SheetTitle className="text-xl font-semibold tracking-tight">
          <FormattedMessage id="settings.security.changeEmail.title" />
        </SheetTitle>
        <SheetDescription className="mt-2 text-sm leading-6 text-muted-foreground">
          <FormattedMessage id="settings.security.changeEmail.explanation" />
        </SheetDescription>

        <form noValidate className="mt-5 space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="security-current-email">
              <FormattedMessage id="settings.security.changeEmail.currentEmail" />
            </Label>
            <Input
              id="security-current-email"
              readOnly
              value={currentEmail ?? ''}
              aria-describedby="security-current-email-help"
              className="rounded-xl border-border/75"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="security-new-email">
              <FormattedMessage id="settings.security.changeEmail.newEmail" />
            </Label>
            <Input
              id="security-new-email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(newEmailError)}
              placeholder={intl.formatMessage({
                id: 'settings.security.changeEmail.newEmailPlaceholder',
              })}
              className="rounded-xl border-border/75"
              {...form.register('newEmail')}
            />
            <p className="text-xs text-muted-foreground">
              {newEmailError ? (
                <FormattedMessage id={getEmailErrorId(newEmailError.message)} />
              ) : null}
            </p>
          </div>

          {status !== 'idle' ? (
            <p
              className={
                status === 'pending_confirmation'
                  ? 'rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300'
                  : 'rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive'
              }
            >
              <FormattedMessage id={`settings.security.changeEmail.status.${status}`} />
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
              <FormattedMessage id="action.cancel" />
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              <FormattedMessage id="settings.security.changeEmail.continue" />
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
