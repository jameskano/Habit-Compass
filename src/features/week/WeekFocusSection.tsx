import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useIntl } from 'react-intl'
import { z } from 'zod'

import { WEEKLY_FOCUS_MAX_LENGTH, type WeeklyPlan } from '@/domain/planning'
import type { ISODateString } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet'
import { Textarea } from '@/shared/ui/textarea'

const FocusFormSchema = z.object({
  focusText: z.string().max(WEEKLY_FOCUS_MAX_LENGTH),
})

type FocusFormValues = z.infer<typeof FocusFormSchema>

type WeekFocusSectionProps = {
  plan: WeeklyPlan | null
  selectedWeekStart: ISODateString
  pending: boolean
  onSave: (input: { weekStartDate: ISODateString; focusText: string }) => void
}

export const WeekFocusSection = ({
  plan,
  selectedWeekStart,
  pending,
  onSave,
}: WeekFocusSectionProps) => {
  const intl = useIntl()
  const focusInputId = useId()
  const [open, setOpen] = useState(false)
  const form = useForm<FocusFormValues>({
    resolver: zodResolver(FocusFormSchema),
    defaultValues: { focusText: plan?.focusText ?? '' },
  })
  const focusText = form.watch('focusText')

  useEffect(() => {
    form.reset({ focusText: plan?.focusText ?? '' })
  }, [form, plan?.focusText, selectedWeekStart])

  return (
    <>
      <Card className="rounded-2xl border-border/70 bg-card/85 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <h2 className="text-base font-semibold">
              {intl.formatMessage({ id: 'page.week.focus.title' })}
            </h2>
            {plan?.focusText ? (
              <p className="text-sm leading-6 text-foreground">{plan.focusText}</p>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                {intl.formatMessage({ id: 'page.week.focus.empty' })}
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            className="size-10 shrink-0 rounded-full border border-border/70 p-0"
            aria-label={intl.formatMessage({ id: 'page.week.focus.edit' })}
            onClick={() => setOpen(true)}
          >
            <Pencil aria-hidden="true" size={17} />
          </Button>
        </div>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          aria-label={intl.formatMessage({ id: 'page.week.focus.sheetTitle' })}
          aria-describedby={undefined}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <SheetTitle className="text-xl font-semibold">
              {intl.formatMessage({ id: 'page.week.focus.sheetTitle' })}
            </SheetTitle>
            <Button
              variant="ghost"
              type="button"
              className="h-10 w-10 rounded-full border border-border/70 p-0"
              aria-label={intl.formatMessage({ id: 'action.close' })}
              onClick={() => setOpen(false)}
            >
              <X aria-hidden="true" size={18} />
            </Button>
          </div>
          <form
            noValidate
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => {
              onSave({ weekStartDate: selectedWeekStart, focusText: values.focusText })
              setOpen(false)
            })}
          >
            <label className="block text-sm font-medium" htmlFor={focusInputId}>
              {intl.formatMessage({ id: 'page.week.focus.inputLabel' })}
            </label>
            <Textarea
              id={focusInputId}
              maxLength={WEEKLY_FOCUS_MAX_LENGTH}
              placeholder={intl.formatMessage({ id: 'page.week.focus.placeholder' })}
              className="min-h-28 rounded-xl border-border/75"
              {...form.register('focusText')}
            />
            <p className="text-xs text-muted-foreground">
              {intl.formatMessage(
                { id: 'page.week.focus.characterLimit' },
                { count: focusText.length, max: WEEKLY_FOCUS_MAX_LENGTH },
              )}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                className="flex-1 rounded-xl border border-border/70"
                onClick={() => setOpen(false)}
              >
                {intl.formatMessage({ id: 'action.cancel' })}
              </Button>
              <Button type="submit" className="flex-1 rounded-xl" disabled={pending}>
                {intl.formatMessage({ id: 'action.save' })}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
