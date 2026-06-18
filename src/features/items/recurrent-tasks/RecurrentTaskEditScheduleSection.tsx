import type { UseFormReturn } from 'react-hook-form'
import { useIntl } from 'react-intl'

import { dayOfWeekValues, recurrenceKinds, type DayOfWeek } from '@/domain/recurrent-tasks'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { cn } from '@/shared/utils/cn'

import { RECURRENT_TASK_EDIT_INPUT_CLASS } from './recurrentTaskEdit.constants'
import type { RecurrentTaskEditValues } from './recurrentTaskEdit.schema'

type RecurrentTaskEditScheduleSectionProps = {
  form: UseFormReturn<RecurrentTaskEditValues>
  recurrenceKind: RecurrentTaskEditValues['recurrenceKind']
  selectedDays: RecurrentTaskEditValues['daysOfWeek']
  selectedWeekday: RecurrentTaskEditValues['weekday']
  onRecurrenceKindChange: (value: string) => void
  onToggleDay: (day: DayOfWeek) => void
  onWeekdayChange: (value: string) => void
}

export const RecurrentTaskEditScheduleSection = ({
  form,
  recurrenceKind,
  selectedDays,
  selectedWeekday,
  onRecurrenceKindChange,
  onToggleDay,
  onWeekdayChange,
}: RecurrentTaskEditScheduleSectionProps) => {
  const intl = useIntl()

  return (
    <section className="space-y-4 rounded-[1.4rem] border border-border/70 bg-card/90 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {intl.formatMessage({ id: 'page.items.recurrent.edit.essentials' })}
      </p>
      <label className="block text-sm font-medium">
        {intl.formatMessage({ id: 'page.items.recurrent.edit.name' })}
        <Input {...form.register('title')} className={RECURRENT_TASK_EDIT_INPUT_CLASS} />
        {form.formState.errors.title ? (
          <span className="mt-1 block text-xs text-amber-700">
            {intl.formatMessage({ id: 'page.items.recurrent.edit.error.name' })}
          </span>
        ) : null}
      </label>
      <label className="block text-sm font-medium">
        {intl.formatMessage({ id: 'page.items.recurrent.edit.frequency' })}
        <Select value={recurrenceKind} onValueChange={onRecurrenceKindChange}>
          <SelectTrigger
            aria-label={intl.formatMessage({ id: 'page.items.recurrent.edit.frequency' })}
            className={RECURRENT_TASK_EDIT_INPUT_CLASS}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {recurrenceKinds.map((kind) => (
              <SelectItem key={kind} value={kind}>
                {intl.formatMessage({ id: `page.items.recurrent.edit.schedule.${kind}` })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      {recurrenceKind === 'specificDaysOfWeek' || recurrenceKind === 'everyXWeeks' ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">
            {intl.formatMessage({ id: 'page.items.recurrent.edit.days' })}
          </legend>
          <div className="flex flex-wrap gap-2">
            {dayOfWeekValues.map((day) => (
              <Button
                variant="ghost"
                key={day}
                type="button"
                aria-pressed={selectedDays.includes(day)}
                onClick={() => onToggleDay(day)}
                className={cn(
                  'rounded-full border border-border/75 px-3 py-2 text-xs font-medium',
                  selectedDays.includes(day) && 'border-primary bg-primary text-primary-foreground',
                )}
              >
                {intl.formatMessage({ id: `page.items.weekday.short.${day}` })}
              </Button>
            ))}
          </div>
          {form.formState.errors.daysOfWeek ? (
            <span className="text-xs text-amber-700">
              {intl.formatMessage({ id: 'page.items.recurrent.edit.error.days' })}
            </span>
          ) : null}
        </fieldset>
      ) : null}
      {recurrenceKind === 'specificDaysOfMonth' ? (
        <label className="block text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.create.frequency.monthDays' })}
          <Input {...form.register('daysOfMonth')} className={RECURRENT_TASK_EDIT_INPUT_CLASS} />
          {form.formState.errors.daysOfMonth ? (
            <span className="mt-1 block text-xs text-amber-700">
              {intl.formatMessage({ id: 'page.items.recurrent.edit.error.days' })}
            </span>
          ) : null}
        </label>
      ) : null}
      {recurrenceKind === 'specificDaysOfYear' ? (
        <label className="block text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.create.frequency.yearDays' })}
          <Input {...form.register('daysOfYear')} className={RECURRENT_TASK_EDIT_INPUT_CLASS} />
          {form.formState.errors.daysOfYear ? (
            <span className="mt-1 block text-xs text-amber-700">
              {intl.formatMessage({ id: 'page.items.recurrent.edit.error.days' })}
            </span>
          ) : null}
        </label>
      ) : null}
      {recurrenceKind === 'everyXDays' ? (
        <label className="block text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.recurrent.edit.intervalDays' })}
          <Input
            type="number"
            min={1}
            {...form.register('intervalDays', { valueAsNumber: true })}
            className={RECURRENT_TASK_EDIT_INPUT_CLASS}
          />
        </label>
      ) : null}
      {recurrenceKind === 'everyXWeeks' ? (
        <label className="block text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.recurrent.edit.intervalWeeks' })}
          <Input
            type="number"
            min={1}
            {...form.register('intervalWeeks', { valueAsNumber: true })}
            className={RECURRENT_TASK_EDIT_INPUT_CLASS}
          />
        </label>
      ) : null}
      {recurrenceKind === 'everyXMonths' ? (
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">
            {intl.formatMessage({ id: 'page.items.recurrent.edit.intervalMonths' })}
            <Input
              type="number"
              min={1}
              {...form.register('intervalMonths', { valueAsNumber: true })}
              className={RECURRENT_TASK_EDIT_INPUT_CLASS}
            />
          </label>
          <label className="block text-sm font-medium">
            {intl.formatMessage({ id: 'page.items.recurrent.edit.dayOfMonth' })}
            <Input
              type="number"
              min={1}
              max={31}
              {...form.register('dayOfMonth', { valueAsNumber: true })}
              className={RECURRENT_TASK_EDIT_INPUT_CLASS}
            />
          </label>
        </div>
      ) : null}
      {recurrenceKind === 'firstWeekdayOfMonth' ? (
        <label className="block text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.recurrent.edit.weekday' })}
          <Select value={String(selectedWeekday)} onValueChange={onWeekdayChange}>
            <SelectTrigger
              aria-label={intl.formatMessage({ id: 'page.items.recurrent.edit.weekday' })}
              className={RECURRENT_TASK_EDIT_INPUT_CLASS}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dayOfWeekValues.map((day) => (
                <SelectItem key={day} value={String(day)}>
                  {intl.formatMessage({ id: `page.items.weekday.long.${day}` })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      ) : null}
      {recurrenceKind === 'customFutureRule' ? (
        <label className="block text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.recurrent.edit.customDescription' })}
          <Input
            {...form.register('customDescription')}
            className={RECURRENT_TASK_EDIT_INPUT_CLASS}
          />
        </label>
      ) : null}
    </section>
  )
}
