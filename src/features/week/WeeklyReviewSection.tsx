import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useId } from 'react'
import { useForm } from 'react-hook-form'
import { useIntl } from 'react-intl'
import { z } from 'zod'

import type { WeeklyPlan } from '@/domain/planning'
import type { ISODateString } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Textarea } from '@/shared/ui/textarea'

const ReviewFormSchema = z.object({
  reviewWentWell: z.string(),
  reviewGotInWay: z.string(),
  reviewAdjustNextWeek: z.string(),
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
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(ReviewFormSchema),
    defaultValues: {
      reviewWentWell: plan?.reviewWentWell ?? '',
      reviewGotInWay: plan?.reviewGotInWay ?? '',
      reviewAdjustNextWeek: plan?.reviewAdjustNextWeek ?? '',
    },
  })

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
      <div className="mb-4">
        <h2 className="text-base font-semibold">
          {intl.formatMessage({ id: 'page.week.review.title' })}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {intl.formatMessage({ id: 'page.week.review.helper' })}
        </p>
      </div>

      <form
        noValidate
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => onSave({ weekStartDate: selectedWeekStart, ...values }))}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor={wentWellId}>
            {intl.formatMessage({ id: 'page.week.review.wentWell' })}
          </label>
          <Textarea
            id={wentWellId}
            className="min-h-24 rounded-xl border-border/75"
            {...form.register('reviewWentWell')}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor={gotInWayId}>
            {intl.formatMessage({ id: 'page.week.review.gotInWay' })}
          </label>
          <Textarea
            id={gotInWayId}
            className="min-h-24 rounded-xl border-border/75"
            {...form.register('reviewGotInWay')}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor={adjustId}>
            {intl.formatMessage({ id: 'page.week.review.adjust' })}
          </label>
          <Textarea
            id={adjustId}
            className="min-h-24 rounded-xl border-border/75"
            {...form.register('reviewAdjustNextWeek')}
          />
        </div>
        <Button type="submit" className="w-full rounded-xl sm:w-auto" disabled={pending}>
          {intl.formatMessage({ id: 'page.week.review.save' })}
        </Button>
      </form>
    </Card>
  )
}
