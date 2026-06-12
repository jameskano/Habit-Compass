import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useIntl } from 'react-intl'
import { z } from 'zod'

import { WEEKLY_REVIEW_ANSWER_MAX_LENGTH, type WeeklyPlan } from '@/domain/planning'
import type { ISODateString } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Textarea } from '@/shared/ui/textarea'
import { cn } from '@/shared/utils/cn'

const ReviewFormSchema = z.object({
  reviewWentWell: z.string().max(WEEKLY_REVIEW_ANSWER_MAX_LENGTH),
  reviewGotInWay: z.string().max(WEEKLY_REVIEW_ANSWER_MAX_LENGTH),
  reviewAdjustNextWeek: z.string().max(WEEKLY_REVIEW_ANSWER_MAX_LENGTH),
})

type ReviewFormValues = z.infer<typeof ReviewFormSchema>

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
  const [open, setOpen] = useState(false)
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(ReviewFormSchema),
    defaultValues: {
      reviewWentWell: plan?.reviewWentWell ?? '',
      reviewGotInWay: plan?.reviewGotInWay ?? '',
      reviewAdjustNextWeek: plan?.reviewAdjustNextWeek ?? '',
    },
  })
  const reviewWentWell = form.watch('reviewWentWell')
  const reviewGotInWay = form.watch('reviewGotInWay')
  const reviewAdjustNextWeek = form.watch('reviewAdjustNextWeek')

  useEffect(() => {
    form.reset({
      reviewWentWell: plan?.reviewWentWell ?? '',
      reviewGotInWay: plan?.reviewGotInWay ?? '',
      reviewAdjustNextWeek: plan?.reviewAdjustNextWeek ?? '',
    })
  }, [
    form,
    plan?.reviewAdjustNextWeek,
    plan?.reviewGotInWay,
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
          <Button type="submit" className="w-full rounded-xl sm:w-auto" disabled={pending}>
            {intl.formatMessage({ id: 'page.week.review.save' })}
          </Button>
        </form>
      ) : null}
    </Card>
  )
}
