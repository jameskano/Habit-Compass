import { useRouterState } from '@tanstack/react-router'
import { Send } from 'lucide-react'
import { useId, useMemo } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'

import { useAppPreferencesStore } from '@/app/state/appPreferencesStore'
import { FEEDBACK_MESSAGE_MAX_LENGTH } from '@/domain/feedback'
import { BackButton } from '@/shared/ui/BackButton'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { useShellLeading } from '@/shared/ui/useShellLeading'
import { useShellTitle } from '@/shared/ui/useShellTitle'
import { cn } from '@/shared/utils/cn'

import { SettingsStatusMessage } from '../components/SettingsStatusMessage'
import { FeedbackTypeSelector } from './FeedbackTypeSelector'
import { ScreenshotField } from './ScreenshotField'
import { useSupportFeedbackForm } from './useSupportFeedbackForm'

export const SupportPage = () => {
  const intl = useIntl()
  const locale = useAppPreferencesStore((state) => state.locale)
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const messageId = useId()
  const replyEmailId = useId()
  const screenshotId = useId()
  const {
    fileErrorId,
    form,
    handleFileChange,
    isPending,
    removeSelectedFile,
    selectedFile,
    status,
    submit,
  } = useSupportFeedbackForm({ locale, pathname })
  const selectedType = form.watch('type')
  const message = form.watch('message')

  useShellTitle('settings.support.title')

  const shellLeading = useMemo(() => <BackButton to="/settings" />, [])
  useShellLeading(shellLeading)

  return (
    <section className="space-y-4">
      <Card className="space-y-4 p-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">
            <FormattedMessage id="settings.support.feedback" />
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            <FormattedMessage id="settings.support.feedback.description" />
          </p>
        </div>

        <form noValidate className="space-y-4" onSubmit={submit}>
          <FeedbackTypeSelector
            selectedType={selectedType}
            onSelect={(type) =>
              form.setValue('type', type, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={messageId}>
              <FormattedMessage id="settings.support.feedback.message.label" />
            </label>
            <Textarea
              id={messageId}
              maxLength={FEEDBACK_MESSAGE_MAX_LENGTH}
              className="min-h-32 rounded-xl border-border/75"
              aria-invalid={Boolean(form.formState.errors.message)}
              {...form.register('message')}
            />
            <div className="flex items-start justify-between gap-3 text-xs">
              <span className="text-destructive">
                {form.formState.errors.message ? (
                  <FormattedMessage id="settings.support.feedback.message.error" />
                ) : null}
              </span>
              <span className="text-muted-foreground">
                <FormattedMessage
                  id="settings.support.feedback.characterLimit"
                  values={{ count: message.length, max: FEEDBACK_MESSAGE_MAX_LENGTH }}
                />
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={replyEmailId}>
              <FormattedMessage id="settings.support.feedback.replyEmail.label" />
            </label>
            <Input
              id={replyEmailId}
              type="email"
              autoComplete="email"
              placeholder={intl.formatMessage({
                id: 'settings.support.feedback.replyEmail.placeholder',
              })}
              aria-invalid={Boolean(form.formState.errors.replyEmail)}
              {...form.register('replyEmail')}
            />
            <p
              className={cn(
                'text-xs',
                form.formState.errors.replyEmail ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              {form.formState.errors.replyEmail ? (
                <FormattedMessage id="settings.support.feedback.replyEmail.error" />
              ) : (
                <FormattedMessage id="settings.support.feedback.replyEmail.help" />
              )}
            </p>
          </div>

          <ScreenshotField
            fileErrorId={fileErrorId}
            id={screenshotId}
            selectedFile={selectedFile}
            onFileChange={handleFileChange}
            onRemoveFile={removeSelectedFile}
          />

          {status !== 'idle' ? (
            <SettingsStatusMessage
              messageId={`settings.support.feedback.status.${status}`}
              tone={status === 'success' ? 'success' : 'error'}
            />
          ) : null}

          <Button
            type="submit"
            className="w-full gap-2 rounded-xl sm:w-auto"
            disabled={isPending || Boolean(fileErrorId)}
          >
            <Send aria-hidden size={16} />
            <FormattedMessage id="settings.support.feedback.submit" />
          </Button>
        </form>
      </Card>
    </section>
  )
}
