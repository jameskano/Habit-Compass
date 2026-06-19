import { memo, useId } from 'react'
import { useFormState, useWatch, type UseFormReturn } from 'react-hook-form'
import { useIntl } from 'react-intl'

import { habitDayOfWeekValues, habitScheduleKinds, type HabitDayOfWeek } from '@/domain/habits'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { cn } from '@/shared/utils/cn'

import { HABIT_EDIT_INPUT_CLASS } from './habitEdit.constants'
import type { HabitEditValues } from './habitEdit.schema'
import { supportsFlexibleSchedule } from './habitEdit.utils'

type HabitEditScheduleSectionProps = {
  form: UseFormReturn<HabitEditValues>
  onScheduleKindChange: (value: string) => void
  onToggleDay: (day: HabitDayOfWeek) => void
  onWeekdayChange: (value: string) => void
}

export const HabitEditScheduleSection = memo(
  ({ form, onScheduleKindChange, onToggleDay, onWeekdayChange }: HabitEditScheduleSectionProps) => {
    const intl = useIntl()
    const nameInputId = useId()
    const { errors } = useFormState({
      control: form.control,
      name: ['title', 'daysOfWeek', 'daysOfMonth', 'daysOfYear'],
    })
    const scheduleKind = useWatch({ control: form.control, name: 'scheduleKind' })
    const selectedDays = useWatch({ control: form.control, name: 'daysOfWeek' })
    const selectedTrackingType = useWatch({ control: form.control, name: 'trackingType' })
    const selectedWeekday = useWatch({ control: form.control, name: 'weekday' })
    const supportsFlexible = supportsFlexibleSchedule(selectedTrackingType)

    return (
      <section className="space-y-4 rounded-[1.4rem] border border-border/70 bg-card/90 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {intl.formatMessage({ id: 'page.items.habit.edit.essentials' })}
        </p>
        <div className="block text-sm font-medium">
          <label htmlFor={nameInputId}>
            {intl.formatMessage({ id: 'page.items.habit.edit.name' })}
          </label>
          <Input id={nameInputId} {...form.register('title')} className={HABIT_EDIT_INPUT_CLASS} />
          {errors.title ? (
            <span className="mt-1 block text-xs text-amber-700">
              {intl.formatMessage({ id: 'page.items.habit.edit.error.name' })}
            </span>
          ) : null}
        </div>
        <label className="block text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.habit.edit.frequency' })}
          <Select value={scheduleKind} onValueChange={onScheduleKindChange}>
            <SelectTrigger
              aria-label={intl.formatMessage({ id: 'page.items.habit.edit.frequency' })}
              className={HABIT_EDIT_INPUT_CLASS}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {habitScheduleKinds.map((kind) => (
                <SelectItem
                  key={kind}
                  value={kind}
                  disabled={kind === 'flexiblePeriod' && !supportsFlexible}
                >
                  {intl.formatMessage({ id: `page.items.habit.edit.schedule.${kind}` })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        {scheduleKind === 'specificDaysOfWeek' || scheduleKind === 'everyXWeeks' ? (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">
              {intl.formatMessage({ id: 'page.items.habit.edit.days' })}
            </legend>
            <div className="flex flex-wrap gap-2">
              {habitDayOfWeekValues.map((day) => (
                <Button
                  variant="ghost"
                  key={day}
                  type="button"
                  aria-pressed={selectedDays.includes(day)}
                  onClick={() => onToggleDay(day)}
                  className={cn(
                    'rounded-full border border-border/75 px-3 py-2 text-xs font-medium',
                    selectedDays.includes(day) &&
                      'border-primary bg-primary text-primary-foreground',
                  )}
                >
                  {intl.formatMessage({ id: `page.items.weekday.short.${day}` })}
                </Button>
              ))}
            </div>
            {errors.daysOfWeek ? (
              <span className="text-xs text-amber-700">
                {intl.formatMessage({ id: 'page.items.habit.edit.error.days' })}
              </span>
            ) : null}
          </fieldset>
        ) : null}

        {scheduleKind === 'specificDaysOfMonth' ? (
          <label className="block text-sm font-medium">
            {intl.formatMessage({ id: 'page.items.create.frequency.monthDays' })}
            <Input {...form.register('daysOfMonth')} className={HABIT_EDIT_INPUT_CLASS} />
            {errors.daysOfMonth ? (
              <span className="mt-1 block text-xs text-amber-700">
                {intl.formatMessage({ id: 'page.items.habit.edit.error.days' })}
              </span>
            ) : null}
          </label>
        ) : null}

        {scheduleKind === 'specificDaysOfYear' ? (
          <label className="block text-sm font-medium">
            {intl.formatMessage({ id: 'page.items.create.frequency.yearDays' })}
            <Input {...form.register('daysOfYear')} className={HABIT_EDIT_INPUT_CLASS} />
            {errors.daysOfYear ? (
              <span className="mt-1 block text-xs text-amber-700">
                {intl.formatMessage({ id: 'page.items.habit.edit.error.days' })}
              </span>
            ) : null}
          </label>
        ) : null}

        {scheduleKind === 'everyXDays' ? (
          <label className="block text-sm font-medium">
            {intl.formatMessage({ id: 'page.items.habit.edit.intervalDays' })}
            <Input
              type="number"
              min={1}
              {...form.register('intervalDays', { valueAsNumber: true })}
              className={HABIT_EDIT_INPUT_CLASS}
            />
          </label>
        ) : null}
        {scheduleKind === 'everyXWeeks' ? (
          <label className="block text-sm font-medium">
            {intl.formatMessage({ id: 'page.items.habit.edit.intervalWeeks' })}
            <Input
              type="number"
              min={1}
              {...form.register('intervalWeeks', { valueAsNumber: true })}
              className={HABIT_EDIT_INPUT_CLASS}
            />
          </label>
        ) : null}
        {scheduleKind === 'everyXMonths' ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              {intl.formatMessage({ id: 'page.items.habit.edit.intervalMonths' })}
              <Input
                type="number"
                min={1}
                {...form.register('intervalMonths', { valueAsNumber: true })}
                className={HABIT_EDIT_INPUT_CLASS}
              />
            </label>
            <label className="block text-sm font-medium">
              {intl.formatMessage({ id: 'page.items.habit.edit.dayOfMonth' })}
              <Input
                type="number"
                min={1}
                max={31}
                {...form.register('dayOfMonth', { valueAsNumber: true })}
                className={HABIT_EDIT_INPUT_CLASS}
              />
            </label>
          </div>
        ) : null}
        {scheduleKind === 'firstWeekdayOfMonth' ? (
          <label className="block text-sm font-medium">
            {intl.formatMessage({ id: 'page.items.habit.edit.weekday' })}
            <Select value={String(selectedWeekday)} onValueChange={onWeekdayChange}>
              <SelectTrigger
                aria-label={intl.formatMessage({ id: 'page.items.habit.edit.weekday' })}
                className={HABIT_EDIT_INPUT_CLASS}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {habitDayOfWeekValues.map((day) => (
                  <SelectItem key={day} value={String(day)}>
                    {intl.formatMessage({ id: `page.items.weekday.long.${day}` })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        ) : null}
      </section>
    )
  },
)

HabitEditScheduleSection.displayName = 'HabitEditScheduleSection'
