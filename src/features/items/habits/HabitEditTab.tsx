import { zodResolver } from '@hookform/resolvers/zod'
import { Archive, RotateCcw, Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useIntl } from 'react-intl'
import { z } from 'zod'

import {
  habitDayOfWeekValues,
  habitScheduleKinds,
  type Habit,
  type HabitCompletionLevel,
  type HabitDayOfWeek,
  type HabitScheduleRule,
  type UpdateHabitInput,
} from '@/domain/habits'
import type { Category } from '@/domain/categories'
import { habitPriorities } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Input } from '@/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { cn } from '@/shared/utils/cn'
import { priorityVisualClasses } from '@/styles/itemVisualTokens'

import type { HabitDangerAction } from './HabitConfirmationDialog'

type HabitEditTabProps = {
  habit: Habit
  categories: Category[]
  archived: boolean
  pending: boolean
  onSave: (input: UpdateHabitInput) => void
  onArchive: () => void
  onRequestDangerAction: (action: HabitDangerAction) => void
}

const periodBasedTrackingTypes = new Set([
  'timesPerPeriod',
  'repetitionsPerPeriod',
  'totalTimePerPeriod',
  'totalQuantityPerPeriod',
])

const HabitEditValuesSchema = z
  .object({
    title: z.string().trim().min(1),
    categoryId: z.string(),
    priority: z.enum(habitPriorities),
    scheduleKind: z.enum(habitScheduleKinds),
    daysOfWeek: z.array(z.number().int().min(0).max(6)),
    intervalDays: z.number().int().positive(),
    intervalWeeks: z.number().int().positive(),
    intervalMonths: z.number().int().positive(),
    dayOfMonth: z.number().int().min(1).max(31),
    weekday: z.number().int().min(0).max(6),
    startsOn: z.string().min(1),
    endsOn: z.string(),
    notes: z.string(),
    usesCompletionLevels: z.boolean(),
    defaultCompletionLevel: z.enum(['minimum', 'standard']),
  })
  .superRefine((value, context) => {
    if (value.endsOn && value.endsOn < value.startsOn) {
      context.addIssue({ code: 'custom', path: ['endsOn'], message: 'invalidEndDate' })
    }
    if (
      (value.scheduleKind === 'specificDaysOfWeek' || value.scheduleKind === 'everyXWeeks') &&
      value.daysOfWeek.length === 0
    ) {
      context.addIssue({ code: 'custom', path: ['daysOfWeek'], message: 'chooseDay' })
    }
  })

type HabitEditValues = z.infer<typeof HabitEditValuesSchema>
const noCategoryValue = '__none__'

function defaultValuesForHabit(habit: Habit): HabitEditValues {
  const schedule = habit.scheduleRule
  return {
    title: habit.title,
    categoryId: habit.categoryId ?? '',
    priority: habit.priority,
    scheduleKind: schedule.kind,
    daysOfWeek:
      schedule.kind === 'specificDaysOfWeek' || schedule.kind === 'everyXWeeks'
        ? [...schedule.daysOfWeek]
        : [],
    intervalDays: schedule.kind === 'everyXDays' ? schedule.intervalDays : 2,
    intervalWeeks: schedule.kind === 'everyXWeeks' ? schedule.intervalWeeks : 1,
    intervalMonths: schedule.kind === 'everyXMonths' ? schedule.intervalMonths : 1,
    dayOfMonth: schedule.kind === 'everyXMonths' ? schedule.dayOfMonth : 1,
    weekday: schedule.kind === 'firstWeekdayOfMonth' ? schedule.weekday : 1,
    startsOn: habit.startsOn,
    endsOn: habit.endsOn ?? '',
    notes: habit.notes ?? '',
    usesCompletionLevels: habit.usesCompletionLevels,
    defaultCompletionLevel: habit.defaultCompletionLevel ?? 'standard',
  }
}

function buildSchedule(values: HabitEditValues): HabitScheduleRule {
  switch (values.scheduleKind) {
    case 'daily':
      return { kind: 'daily' }
    case 'specificDaysOfWeek':
      return { kind: 'specificDaysOfWeek', daysOfWeek: values.daysOfWeek as HabitDayOfWeek[] }
    case 'everyXDays':
      return { kind: 'everyXDays', intervalDays: values.intervalDays }
    case 'everyXWeeks':
      return {
        kind: 'everyXWeeks',
        intervalWeeks: values.intervalWeeks,
        daysOfWeek: values.daysOfWeek as HabitDayOfWeek[],
      }
    case 'everyXMonths':
      return {
        kind: 'everyXMonths',
        intervalMonths: values.intervalMonths,
        dayOfMonth: values.dayOfMonth,
      }
    case 'firstWeekdayOfMonth':
      return { kind: 'firstWeekdayOfMonth', weekday: values.weekday as HabitDayOfWeek }
    case 'flexiblePeriod':
      return { kind: 'flexiblePeriod' }
  }
}

export function HabitEditTab({
  habit,
  categories,
  archived,
  pending,
  onSave,
  onArchive,
  onRequestDangerAction,
}: HabitEditTabProps) {
  const intl = useIntl()
  const form = useForm<HabitEditValues>({
    resolver: zodResolver(HabitEditValuesSchema),
    defaultValues: defaultValuesForHabit(habit),
  })
  const scheduleKind = form.watch('scheduleKind')
  const usesCompletionLevels = form.watch('usesCompletionLevels')
  const selectedDays = form.watch('daysOfWeek')
  const selectedPriority = form.watch('priority')
  const supportsFlexible = periodBasedTrackingTypes.has(habit.goalConfig.trackingType)

  useEffect(() => {
    form.reset(defaultValuesForHabit(habit))
  }, [form, habit])

  const toggleDay = (day: HabitDayOfWeek) => {
    form.setValue(
      'daysOfWeek',
      selectedDays.includes(day)
        ? selectedDays.filter((value) => value !== day)
        : [...selectedDays, day].sort(),
      { shouldDirty: true, shouldValidate: true },
    )
  }

  const submit = form.handleSubmit((values) => {
    const defaultCompletionLevel: HabitCompletionLevel | null = values.usesCompletionLevels
      ? values.defaultCompletionLevel
      : null

    onSave({
      id: habit.id,
      title: values.title.trim(),
      notes: values.notes.trim() || null,
      categoryId: values.categoryId || null,
      priority: values.priority,
      scheduleRule: buildSchedule(values),
      startsOn: values.startsOn,
      endsOn: values.endsOn || null,
      usesCompletionLevels: values.usesCompletionLevels,
      enabledCompletionLevels: values.usesCompletionLevels ? ['minimum', 'standard'] : ['standard'],
      defaultCompletionLevel,
    })
  })

  const inputClass = 'mt-1.5 rounded-xl border-border/75'

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-5" aria-label={intl.formatMessage({ id: 'page.items.habit.edit.form' })}>
        <section className="space-y-4 rounded-[1.4rem] border border-border/70 bg-card/90 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {intl.formatMessage({ id: 'page.items.habit.edit.essentials' })}
          </p>
          <label className="block text-sm font-medium">
            {intl.formatMessage({ id: 'page.items.habit.edit.name' })}
            <Input {...form.register('title')} className={inputClass} />
            {form.formState.errors.title ? (
              <span className="mt-1 block text-xs text-amber-700">
                {intl.formatMessage({ id: 'page.items.habit.edit.error.name' })}
              </span>
            ) : null}
          </label>
          <label className="block text-sm font-medium">
            {intl.formatMessage({ id: 'page.items.habit.edit.frequency' })}
            <Select
              value={scheduleKind}
              onValueChange={(value) =>
                form.setValue('scheduleKind', value as HabitEditValues['scheduleKind'], {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger
                aria-label={intl.formatMessage({ id: 'page.items.habit.edit.frequency' })}
                className={inputClass}
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

          {(scheduleKind === 'specificDaysOfWeek' || scheduleKind === 'everyXWeeks') ? (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{intl.formatMessage({ id: 'page.items.habit.edit.days' })}</legend>
              <div className="flex flex-wrap gap-2">
                {habitDayOfWeekValues.map((day) => (
                  <Button
                    variant="ghost"
                    key={day}
                    type="button"
                    aria-pressed={selectedDays.includes(day)}
                    onClick={() => toggleDay(day)}
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
                <span className="text-xs text-amber-700">{intl.formatMessage({ id: 'page.items.habit.edit.error.days' })}</span>
              ) : null}
            </fieldset>
          ) : null}

          {scheduleKind === 'everyXDays' ? (
            <label className="block text-sm font-medium">
              {intl.formatMessage({ id: 'page.items.habit.edit.intervalDays' })}
              <Input type="number" min={1} {...form.register('intervalDays', { valueAsNumber: true })} className={inputClass} />
            </label>
          ) : null}
          {scheduleKind === 'everyXWeeks' ? (
            <label className="block text-sm font-medium">
              {intl.formatMessage({ id: 'page.items.habit.edit.intervalWeeks' })}
              <Input type="number" min={1} {...form.register('intervalWeeks', { valueAsNumber: true })} className={inputClass} />
            </label>
          ) : null}
          {scheduleKind === 'everyXMonths' ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium">
                {intl.formatMessage({ id: 'page.items.habit.edit.intervalMonths' })}
                <Input type="number" min={1} {...form.register('intervalMonths', { valueAsNumber: true })} className={inputClass} />
              </label>
              <label className="block text-sm font-medium">
                {intl.formatMessage({ id: 'page.items.habit.edit.dayOfMonth' })}
                <Input type="number" min={1} max={31} {...form.register('dayOfMonth', { valueAsNumber: true })} className={inputClass} />
              </label>
            </div>
          ) : null}
          {scheduleKind === 'firstWeekdayOfMonth' ? (
            <label className="block text-sm font-medium">
              {intl.formatMessage({ id: 'page.items.habit.edit.weekday' })}
              <Select
                value={String(form.watch('weekday'))}
                onValueChange={(value) =>
                  form.setValue('weekday', Number(value) as HabitEditValues['weekday'], {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger
                  aria-label={intl.formatMessage({ id: 'page.items.habit.edit.weekday' })}
                  className={inputClass}
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

        <section className="space-y-4 rounded-[1.4rem] border border-border/70 bg-card/90 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {intl.formatMessage({ id: 'page.items.habit.edit.optional' })}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              {intl.formatMessage({ id: 'page.items.habit.edit.category' })}
              <Select
                value={form.watch('categoryId') || noCategoryValue}
                onValueChange={(value) =>
                  form.setValue(
                    'categoryId',
                    value === noCategoryValue ? '' : value,
                    { shouldDirty: true, shouldValidate: true },
                  )
                }
              >
                <SelectTrigger
                  aria-label={intl.formatMessage({ id: 'page.items.habit.edit.category' })}
                  className={inputClass}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value={noCategoryValue}>
                  {intl.formatMessage({ id: 'page.items.habit.category.none' })}
                </SelectItem>
                {categories
                  .filter((category) => category.lifecycleStatus === 'active')
                  .map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="block text-sm font-medium">
              {intl.formatMessage({ id: 'page.items.habit.edit.priority' })}
              <Select
                value={selectedPriority}
                onValueChange={(value) =>
                  form.setValue('priority', value as HabitEditValues['priority'], {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger
                  aria-label={intl.formatMessage({ id: 'page.items.habit.edit.priority' })}
                  className={cn(inputClass, priorityVisualClasses[selectedPriority])}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                {habitPriorities.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {intl.formatMessage({ id: `page.items.priority.${priority}` })}
                  </SelectItem>
                ))}
                </SelectContent>
              </Select>
            </label>
            <label className="block text-sm font-medium">
              {intl.formatMessage({ id: 'page.items.habit.edit.startsOn' })}
              <Input type="date" {...form.register('startsOn')} className={inputClass} />
            </label>
            <label className="block text-sm font-medium">
              {intl.formatMessage({ id: 'page.items.habit.edit.endsOn' })}
              <Input type="date" {...form.register('endsOn')} className={inputClass} />
              {form.formState.errors.endsOn ? (
                <span className="mt-1 block text-xs text-amber-700">
                  {intl.formatMessage({ id: 'page.items.habit.edit.error.endDate' })}
                </span>
              ) : null}
            </label>
          </div>
          <label className="block text-sm font-medium">
            {intl.formatMessage({ id: 'page.items.habit.edit.notes' })}
            <Textarea {...form.register('notes')} rows={3} className={inputClass} />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-xl border border-border/65 bg-muted/35 p-3 text-sm">
            <span>{intl.formatMessage({ id: 'page.items.habit.edit.completionLevels' })}</span>
            <Checkbox {...form.register('usesCompletionLevels')} />
          </label>
          {usesCompletionLevels ? (
            <label className="block text-sm font-medium">
              {intl.formatMessage({ id: 'page.items.habit.edit.defaultLevel' })}
              <Select
                value={form.watch('defaultCompletionLevel')}
                onValueChange={(value) =>
                  form.setValue(
                    'defaultCompletionLevel',
                    value as HabitEditValues['defaultCompletionLevel'],
                    { shouldDirty: true, shouldValidate: true },
                  )
                }
              >
                <SelectTrigger
                  aria-label={intl.formatMessage({ id: 'page.items.habit.edit.defaultLevel' })}
                  className={inputClass}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimum">{intl.formatMessage({ id: 'page.items.habit.dayState.completed_minimum' })}</SelectItem>
                  <SelectItem value="standard">{intl.formatMessage({ id: 'page.items.habit.dayState.completed_standard' })}</SelectItem>
                </SelectContent>
              </Select>
            </label>
          ) : null}
        </section>

        <Button type="submit" className="w-full rounded-xl" disabled={pending}>
          {intl.formatMessage({ id: 'page.items.habit.edit.save' })}
        </Button>
      </form>

      <section className="space-y-3 rounded-[1.4rem] border border-amber-200/75 bg-amber-50/55 p-4 dark:border-amber-900/70 dark:bg-amber-950/20">
        <h3 className="text-sm font-semibold">{intl.formatMessage({ id: 'page.items.habit.edit.dangerTitle' })}</h3>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 border border-border/60 bg-card/75"
          disabled={archived || pending}
          onClick={onArchive}
        >
          <Archive aria-hidden="true" size={17} />
          {intl.formatMessage({ id: 'page.items.habit.menu.archive' })}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 border border-border/60 bg-card/75"
          disabled={pending}
          onClick={() => onRequestDangerAction('reset')}
        >
          <RotateCcw aria-hidden="true" size={17} />
          {intl.formatMessage({ id: 'page.items.habit.menu.reset' })}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 border border-amber-200 bg-amber-100/55 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
          disabled={pending}
          onClick={() => onRequestDangerAction('delete')}
        >
          <Trash2 aria-hidden="true" size={17} />
          {intl.formatMessage({ id: 'page.items.habit.menu.delete' })}
        </Button>
      </section>
    </div>
  )
}
