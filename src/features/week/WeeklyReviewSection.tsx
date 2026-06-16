import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useIntl } from 'react-intl'
import { z } from 'zod'

import {
  WEEKLY_REVIEW_ANSWER_MAX_LENGTH,
  WEEKLY_REVIEW_FEELINGS,
  WEEKLY_REVIEW_REFLECTIONS_MAX_LENGTH,
  type WeeklyPlan,
  type WeeklyReviewFeeling,
} from '@/domain/planning'
import type { ISODateString } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Textarea } from '@/shared/ui/textarea'
import { cn } from '@/shared/utils/cn'

const ReviewFormSchema = z.object({
  reviewOverallFeeling: z.enum(WEEKLY_REVIEW_FEELINGS).nullable(),
  reviewWentWell: z.string().max(WEEKLY_REVIEW_ANSWER_MAX_LENGTH),
  reviewGotInWay: z.string().max(WEEKLY_REVIEW_ANSWER_MAX_LENGTH),
  reviewAdjustNextWeek: z.string().max(WEEKLY_REVIEW_ANSWER_MAX_LENGTH),
  reviewReflections: z.string().max(WEEKLY_REVIEW_REFLECTIONS_MAX_LENGTH),
})

type ReviewFormValues = z.infer<typeof ReviewFormSchema>

const feelingOptions: { value: WeeklyReviewFeeling; labelId: string }[] = [
  { value: 'great', labelId: 'page.week.review.feeling.great' },
  { value: 'good', labelId: 'page.week.review.feeling.good' },
  { value: 'okay', labelId: 'page.week.review.feeling.okay' },
  { value: 'hard', labelId: 'page.week.review.feeling.hard' },
  { value: 'veryHard', labelId: 'page.week.review.feeling.veryHard' },
]

type WeeklyReviewSectionProps = {
  plan: WeeklyPlan | null
  pending: boolean
  selectedWeekStart: ISODateString
  onSave: (input: { weekStartDate: ISODateString } & ReviewFormValues) => void
}

export const WeeklyReviewSection = ({
  plan,
  pending,
  selectedWeekStart,
  onSave,
}: WeeklyReviewSectionProps) => {
  const intl = useIntl()
  const wentWellId = useId()
  const gotInWayId = useId()
  const adjustId = useId()
  const reflectionsId = useId()
  const [open, setOpen] = useState(false)
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(ReviewFormSchema),
    defaultValues: {
      reviewOverallFeeling: plan?.reviewOverallFeeling ?? null,
      reviewWentWell: plan?.reviewWentWell ?? '',
      reviewGotInWay: plan?.reviewGotInWay ?? '',
      reviewAdjustNextWeek: plan?.reviewAdjustNextWeek ?? '',
      reviewReflections: plan?.reviewReflections ?? '',
    },
  })
  const reviewOverallFeeling = form.watch('reviewOverallFeeling')
  const reviewWentWell = form.watch('reviewWentWell')
  const reviewGotInWay = form.watch('reviewGotInWay')
  const reviewAdjustNextWeek = form.watch('reviewAdjustNextWeek')
  const reviewReflections = form.watch('reviewReflections')

  useEffect(() => {
    form.reset({
      reviewOverallFeeling: plan?.reviewOverallFeeling ?? null,
      reviewWentWell: plan?.reviewWentWell ?? '',
      reviewGotInWay: plan?.reviewGotInWay ?? '',
      reviewAdjustNextWeek: plan?.reviewAdjustNextWeek ?? '',
      reviewReflections: plan?.reviewReflections ?? '',
    })
  }, [
    form,
    plan?.reviewAdjustNextWeek,
    plan?.reviewGotInWay,
    plan?.reviewOverallFeeling,
    plan?.reviewReflections,
    plan?.reviewWentWell,
    selectedWeekStart,
  ])

  return (
    <Card className="rounded-2xl border-border/70 bg-card/85 p-4">
      <Button
        type="button"
        variant="ghost"
        className="flex h-auto w-full justify-between rounded-xl px-0 py-0 text-left hover:bg-transparent"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="text-base font-semibold">
          {intl.formatMessage({ id: 'page.week.review.title' })}
        </span>
        <ChevronDown
          aria-hidden="true"
          size={18}
          className={cn('mt-0.5 shrink-0 transition-transform', open && 'rotate-180')}
        />
      </Button>

      {open ? (
        <form
          noValidate
          className="mt-4 space-y-4"
          onSubmit={form.handleSubmit((values) =>
            onSave({ weekStartDate: selectedWeekStart, ...values }),
          )}
        >
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">
              {intl.formatMessage({ id: 'page.week.review.feeling.label' })}
            </legend>
            <div className="flex flex-wrap gap-2">
              {feelingOptions.map((option) => {
                const selected = reviewOverallFeeling === option.value

                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant="ghost"
                    aria-pressed={selected}
                    className={cn(
                      'h-9 rounded-full border border-border/70 px-3 text-sm font-medium',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-background/60 text-muted-foreground hover:bg-muted',
                    )}
                    onClick={() =>
                      form.setValue('reviewOverallFeeling', option.value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    {intl.formatMessage({ id: option.labelId })}
                  </Button>
                )
              })}
            </div>
          </fieldset>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={wentWellId}>
              {intl.formatMessage({ id: 'page.week.review.wentWell' })}
            </label>
            <Textarea
              id={wentWellId}
              maxLength={WEEKLY_REVIEW_ANSWER_MAX_LENGTH}
              className="min-h-24 rounded-xl border-border/75"
              {...form.register('reviewWentWell')}
            />
            <p className="text-xs text-muted-foreground">
              {intl.formatMessage(
                { id: 'page.week.review.characterLimit' },
                { count: reviewWentWell.length, max: WEEKLY_REVIEW_ANSWER_MAX_LENGTH },
              )}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={gotInWayId}>
              {intl.formatMessage({ id: 'page.week.review.gotInWay' })}
            </label>
            <Textarea
              id={gotInWayId}
              maxLength={WEEKLY_REVIEW_ANSWER_MAX_LENGTH}
              className="min-h-24 rounded-xl border-border/75"
              {...form.register('reviewGotInWay')}
            />
            <p className="text-xs text-muted-foreground">
              {intl.formatMessage(
                { id: 'page.week.review.characterLimit' },
                { count: reviewGotInWay.length, max: WEEKLY_REVIEW_ANSWER_MAX_LENGTH },
              )}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={adjustId}>
              {intl.formatMessage({ id: 'page.week.review.adjust' })}
            </label>
            <Textarea
              id={adjustId}
              maxLength={WEEKLY_REVIEW_ANSWER_MAX_LENGTH}
              className="min-h-24 rounded-xl border-border/75"
              {...form.register('reviewAdjustNextWeek')}
            />
            <p className="text-xs text-muted-foreground">
              {intl.formatMessage(
                { id: 'page.week.review.characterLimit' },
                { count: reviewAdjustNextWeek.length, max: WEEKLY_REVIEW_ANSWER_MAX_LENGTH },
              )}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={reflectionsId}>
              {intl.formatMessage({ id: 'page.week.review.reflections' })}
            </label>
            <Textarea
              id={reflectionsId}
              maxLength={WEEKLY_REVIEW_REFLECTIONS_MAX_LENGTH}
              className="min-h-28 rounded-xl border-border/75"
              {...form.register('reviewReflections')}
            />
            <p className="text-xs text-muted-foreground">
              {intl.formatMessage(
                { id: 'page.week.review.characterLimit' },
                { count: reviewReflections.length, max: WEEKLY_REVIEW_REFLECTIONS_MAX_LENGTH },
              )}
            </p>
          </div>
          <Button type="submit" className="w-full rounded-xl sm:w-auto" disabled={pending}>
            {intl.formatMessage({ id: 'page.week.review.save' })}
          </Button>
        </form>
      ) : null}
    </Card>
  )
}
