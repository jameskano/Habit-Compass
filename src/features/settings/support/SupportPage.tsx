import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { ArrowLeft, Info, Send, Star, Trash2, Upload } from 'lucide-react'
import { useCallback, useId, useMemo, useState, type ReactNode } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { FormattedMessage, useIntl } from 'react-intl'
import { z } from 'zod'

import { useAppPreferencesStore } from '@/app/state/appPreferencesStore'
import {
  FEEDBACK_ATTACHMENT_MAX_BYTES,
  FEEDBACK_ATTACHMENT_MIME_TYPES,
  FEEDBACK_MESSAGE_MAX_LENGTH,
  FeedbackTypeSchema,
  type FeedbackAttachmentInput,
  type FeedbackTechnicalDetails,
  type FeedbackType,
} from '@/domain/feedback'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Checkbox } from '@/shared/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { useShellLeading } from '@/shared/ui/useShellLeading'
import { useShellTitle } from '@/shared/ui/useShellTitle'
import { cn } from '@/shared/utils/cn'

import { useSubmitFeedbackMutation } from './useSubmitFeedbackMutation'

const normalizeOptionalString = (value: unknown) => {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const FeedbackFormSchema = z.object({
  type: FeedbackTypeSchema,
  message: z.string().trim().min(1).max(FEEDBACK_MESSAGE_MAX_LENGTH),
  replyEmail: z.preprocess(normalizeOptionalString, z.email().nullable().optional()),
  includeTechnicalDetails: z.boolean(),
})

type FeedbackFormValues = z.infer<typeof FeedbackFormSchema>

const feedbackTypeOptions: { value: FeedbackType; labelId: string }[] = [
  { value: 'suggestion', labelId: 'settings.support.feedback.type.suggestion' },
  { value: 'problem', labelId: 'settings.support.feedback.type.problem' },
  { value: 'other', labelId: 'settings.support.feedback.type.other' },
]

const appVersion = import.meta.env.VITE_APP_VERSION ?? 'dev'
const appBuildNumber = import.meta.env.VITE_APP_BUILD_NUMBER ?? null

const BackButton = ({ children, onBack }: { children: ReactNode; onBack: () => void }) => (
  <Button
    variant="ghost"
    className="size-10 rounded-full border border-border/70 bg-card/90 p-0 text-foreground"
    aria-label={String(children)}
    onClick={onBack}
  >
    <ArrowLeft aria-hidden size={20} />
    <span className="sr-only">{children}</span>
  </Button>
)

const buildTechnicalDetails = (locale: string, screenId: string): FeedbackTechnicalDetails => ({
  appVersion,
  buildNumber: appBuildNumber,
  platform: 'web',
  appLanguage: locale,
  screenId,
  submittedAt: new Date().toISOString(),
  userAgent: typeof navigator === 'undefined' ? null : navigator.userAgent,
})

const buildAttachmentInput = (file: File | null): FeedbackAttachmentInput | null => {
  if (!file) {
    return null
  }

  return {
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    file,
  }
}

export const SupportPage = () => {
  const intl = useIntl()
  const navigate = useNavigate()
  const locale = useAppPreferencesStore((state) => state.locale)
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [rateDialogOpen, setRateDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'offline' | 'success' | 'error'>('idle')
  const submitFeedback = useSubmitFeedbackMutation()
  const messageId = useId()
  const replyEmailId = useId()
  const screenshotId = useId()
  const technicalDetailsId = useId()

  useShellTitle('settings.support.title')

  const handleBack = useCallback(() => {
    navigate({ to: '/settings' })
  }, [navigate])
  const shellLeading = useMemo(
    () => <BackButton onBack={handleBack}>{intl.formatMessage({ id: 'action.back' })}</BackButton>,
    [handleBack, intl],
  )
  useShellLeading(shellLeading)

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(FeedbackFormSchema) as Resolver<FeedbackFormValues>,
    defaultValues: {
      type: 'suggestion',
      message: '',
      replyEmail: null,
      includeTechnicalDetails: false,
    },
  })
  const selectedType = form.watch('type')
  const includeTechnicalDetails = form.watch('includeTechnicalDetails')
  const message = form.watch('message')

  const handleFileChange = (fileList: FileList | null) => {
    const file = fileList?.[0] ?? null

    if (!file) {
      setSelectedFile(null)
      setFileError(null)
      return
    }

    if (
      !FEEDBACK_ATTACHMENT_MIME_TYPES.includes(
        file.type as (typeof FEEDBACK_ATTACHMENT_MIME_TYPES)[number],
      )
    ) {
      setSelectedFile(null)
      setFileError(intl.formatMessage({ id: 'settings.support.feedback.screenshotTypeError' }))
      return
    }

    if (file.size > FEEDBACK_ATTACHMENT_MAX_BYTES) {
      setSelectedFile(null)
      setFileError(intl.formatMessage({ id: 'settings.support.feedback.screenshotSizeError' }))
      return
    }

    setSelectedFile(file)
    setFileError(null)
  }

  const submit = form.handleSubmit((values) => {
    setStatus('idle')

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setStatus('offline')
      return
    }

    const technicalDetails = values.includeTechnicalDetails
      ? buildTechnicalDetails(locale, pathname)
      : null

    submitFeedback.mutate(
      {
        userId: MOCK_USER_ID,
        type: values.type,
        message: values.message,
        replyEmail: values.replyEmail ?? null,
        technicalDetails,
        screenId: pathname,
        screenshotAttachment: buildAttachmentInput(selectedFile),
      },
      {
        onSuccess: () => {
          form.reset()
          setSelectedFile(null)
          setFileError(null)
          setStatus('success')
        },
        onError: () => setStatus('error'),
      },
    )
  })

  return (
    <section className="space-y-4">
      <Card className="space-y-2 p-3">
        <h2 className="px-3 pt-1 text-sm font-semibold uppercase tracking-normal text-muted-foreground">
          <FormattedMessage id="settings.support.title" />
        </h2>
        <div className="space-y-1">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setRateDialogOpen(true)}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Star aria-hidden size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">
                <FormattedMessage id="settings.support.rate.title" />
              </span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                <FormattedMessage id="settings.support.rate.description" />
              </span>
            </span>
          </button>
        </div>
      </Card>

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
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">
              <FormattedMessage id="settings.support.feedback.type.label" />
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {feedbackTypeOptions.map((option) => {
                const selected = selectedType === option.value

                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant="ghost"
                    aria-pressed={selected}
                    className={cn(
                      'min-h-10 rounded-lg border border-border/70 px-2 text-sm',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-background text-muted-foreground hover:bg-muted',
                    )}
                    onClick={() =>
                      form.setValue('type', option.value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    <FormattedMessage id={option.labelId} />
                  </Button>
                )
              })}
            </div>
          </fieldset>

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
            <div className="flex items-start justify-between gap-3 text-xs text-muted-foreground">
              <span>
                {form.formState.errors.message ? (
                  <FormattedMessage id="settings.support.feedback.message.error" />
                ) : (
                  <FormattedMessage id="settings.support.feedback.message.help" />
                )}
              </span>
              <span>
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
            <p className="text-xs text-muted-foreground">
              {form.formState.errors.replyEmail ? (
                <FormattedMessage id="settings.support.feedback.replyEmail.error" />
              ) : (
                <FormattedMessage id="settings.support.feedback.replyEmail.help" />
              )}
            </p>
          </div>

          <div className="space-y-2 rounded-xl border border-border/70 p-3">
            <label className="flex items-center gap-2 text-sm font-medium" htmlFor={screenshotId}>
              <Upload aria-hidden size={16} />
              <FormattedMessage id="settings.support.feedback.screenshot.label" />
            </label>
            <Input
              id={screenshotId}
              type="file"
              accept={FEEDBACK_ATTACHMENT_MIME_TYPES.join(',')}
              onChange={(event) => handleFileChange(event.currentTarget.files)}
            />
            <p className="text-xs leading-5 text-muted-foreground">
              <FormattedMessage id="settings.support.feedback.screenshot.help" />
            </p>
            {fileError ? <p className="text-xs text-destructive">{fileError}</p> : null}
            {selectedFile ? (
              <div className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2 text-sm">
                <span className="min-w-0 truncate">{selectedFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  className="size-9 shrink-0 rounded-full p-0"
                  aria-label={intl.formatMessage({
                    id: 'settings.support.feedback.screenshot.remove',
                  })}
                  onClick={() => {
                    setSelectedFile(null)
                    setFileError(null)
                  }}
                >
                  <Trash2 aria-hidden size={16} />
                </Button>
              </div>
            ) : null}
          </div>

          <label
            className="flex items-start gap-3 rounded-xl border border-border/70 p-3"
            htmlFor={technicalDetailsId}
          >
            <Checkbox
              id={technicalDetailsId}
              className="mt-0.5"
              checked={includeTechnicalDetails}
              onChange={(event) =>
                form.setValue('includeTechnicalDetails', event.currentTarget.checked, {
                  shouldDirty: true,
                })
              }
            />
            <span className="space-y-1">
              <span className="block text-sm font-medium">
                <FormattedMessage id="settings.support.feedback.technical.label" />
              </span>
              <span className="block text-xs leading-5 text-muted-foreground">
                <FormattedMessage id="settings.support.feedback.technical.help" />
              </span>
            </span>
          </label>

          {includeTechnicalDetails ? (
            <div className="flex gap-2 rounded-xl bg-muted p-3 text-xs leading-5 text-muted-foreground">
              <Info aria-hidden className="mt-0.5 shrink-0" size={15} />
              <p>
                <FormattedMessage
                  id="settings.support.feedback.technical.preview"
                  values={{ version: appVersion, language: locale, screen: pathname }}
                />
              </p>
            </div>
          ) : null}

          {status !== 'idle' ? (
            <p
              className={cn(
                'rounded-xl px-3 py-2 text-sm',
                status === 'success'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'bg-destructive/10 text-destructive',
              )}
            >
              <FormattedMessage id={`settings.support.feedback.status.${status}`} />
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full gap-2 rounded-xl sm:w-auto"
            disabled={submitFeedback.isPending || Boolean(fileError)}
          >
            <Send aria-hidden size={16} />
            <FormattedMessage id="settings.support.feedback.submit" />
          </Button>
        </form>
      </Card>

      <p className="px-2 text-center text-xs text-muted-foreground">
        <FormattedMessage
          id="settings.support.privacyLink"
          values={{
            link: (chunks) => (
              <Link
                key="privacy-policy-link"
                className="font-medium text-primary underline-offset-4 hover:underline"
                to="/settings/data-privacy/privacy-policy"
              >
                {chunks}
              </Link>
            ),
          }}
        />
      </p>

      <Dialog open={rateDialogOpen} onOpenChange={setRateDialogOpen}>
        <DialogContent aria-describedby="rate-app-description">
          <DialogHeader>
            <DialogTitle>
              <FormattedMessage id="settings.support.rate.title" />
            </DialogTitle>
            <DialogDescription id="rate-app-description">
              <FormattedMessage id="settings.support.rate.unavailable" />
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end p-4 sm:px-6">
            <DialogClose asChild>
              <Button variant="secondary">
                <FormattedMessage id="action.close" />
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
