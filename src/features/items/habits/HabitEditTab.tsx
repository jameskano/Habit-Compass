import { zodResolver } from '@hookform/resolvers/zod'
import { Archive, RotateCcw, Trash2 } from 'lucide-react'
import { useEffect, useId, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useIntl } from 'react-intl'
import { z } from 'zod'

import {
  habitDayOfWeekValues,
  habitScheduleKinds,
  type Habit,
  type HabitDayOfWeek,
  type HabitGoalConfig,
  type HabitScheduleRule,
  type UpdateHabitInput,
} from '@/domain/habits'
import type { Category } from '@/domain/categories'
import { habitPriorities } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { cn } from '@/shared/utils/cn'
import { priorityVisualClasses } from '@/styles/itemVisualTokens'

import { GuardedEndDateField, ReadOnlyStartDateField } from '../components/ItemDateFields'
import type { HabitDangerAction } from './HabitConfirmationDialog'

type HabitEditTabProps = {
  habit: Habit
  categories: Category[]
  today: string
  archived: boolean
  pending: boolean
  onSave: (input: UpdateHabitInput, options?: { archiveAfterSave?: boolean }) => void
  onArchive: () => void
  onRequestDangerAction: (action: HabitDangerAction) => void
}

const periodBasedTrackingTypes = new Set([
  'timesPerPeriod',
  'repetitionsPerPeriod',
  'totalTimePerPeriod',
  'totalQuantityPerPeriod',
])

const BaseHabitEditValuesSchema = z.object({
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
  description: z.string(),
  notes: z.string(),
  minimumText: z.string(),
  minimumAmount: z.number(),
})

function createHabitEditValuesSchema(goalConfig: HabitGoalConfig) {
  return BaseHabitEditValuesSchema.superRefine((value, context) => {
    if (value.endsOn && value.endsOn < value.startsOn) {
      context.addIssue({ code: 'custom', path: ['endsOn'], message: 'invalidEndDate' })
    }
    if (
      (value.scheduleKind === 'specificDaysOfWeek' || value.scheduleKind === 'everyXWeeks') &&
      value.daysOfWeek.length === 0
    ) {
      context.addIssue({ code: 'custom', path: ['daysOfWeek'], message: 'chooseDay' })
    }

    if (goalConfig.trackingType !== 'binary') {
      const standardTarget = getStandardTarget(goalConfig)
      if (value.minimumAmount < 0) {
        context.addIssue({
          code: 'custom',
          path: ['minimumAmount'],
          message: 'negativeMinimum',
        })
      } else if (value.minimumAmount > 0 && value.minimumAmount >= standardTarget) {
        context.addIssue({
          code: 'custom',
          path: ['minimumAmount'],
          message: 'minimumAboveStandard',
        })
      }
    }
  })
}

type HabitEditValues = z.infer<typeof BaseHabitEditValuesSchema>
const noCategoryValue = '__none__'

function getStandardTarget(goalConfig: Exclude<HabitGoalConfig, { trackingType: 'binary' }>) {
  switch (goalConfig.trackingType) {
    case 'timesPerPeriod':
      return goalConfig.targetCount
    case 'repetitionsPerPeriod':
      return goalConfig.targetRepetitions
    case 'timePerSession':
    case 'totalTimePerPeriod':
      return goalConfig.targetMinutes
    case 'quantityPerSession':
    case 'totalQuantityPerPeriod':
      return goalConfig.targetQuantity
  }
}

function getMinimumAmount(goalConfig: HabitGoalConfig) {
  switch (goalConfig.trackingType) {
    case 'binary':
      return 0
    case 'timesPerPeriod':
      return goalConfig.minimumCount ?? 0
    case 'repetitionsPerPeriod':
      return goalConfig.minimumRepetitions ?? 0
    case 'timePerSession':
    case 'totalTimePerPeriod':
      return goalConfig.minimumMinutes ?? 0
    case 'quantityPerSession':
    case 'totalQuantityPerPeriod':
      return goalConfig.minimumQuantity ?? 0
  }
}

function getStandardTargetForDisplay(goalConfig: HabitGoalConfig) {
  return goalConfig.trackingType === 'binary' ? null : getStandardTarget(goalConfig)
}

function getMinimumUnitLabel(goalConfig: HabitGoalConfig) {
  switch (goalConfig.trackingType) {
    case 'timePerSession':
    case 'totalTimePerPeriod':
      return 'min'
    case 'quantityPerSession':
    case 'totalQuantityPerPeriod':
      return goalConfig.unitLabel
    default:
      return ''
  }
}

function buildGoalConfigWithMinimum(
  goalConfig: HabitGoalConfig,
  values: HabitEditValues,
): HabitGoalConfig {
  if (goalConfig.trackingType === 'binary') {
    const minimumDescription = values.minimumText.trim()
    if (minimumDescription) {
      return { ...goalConfig, minimumDescription }
    }
    const withoutMinimum = { ...goalConfig }
    delete withoutMinimum.minimumDescription
    return withoutMinimum
  }

  const minimum = values.minimumAmount > 0 ? values.minimumAmount : undefined

  switch (goalConfig.trackingType) {
    case 'timesPerPeriod': {
      const baseGoal = { ...goalConfig }
      delete baseGoal.minimumCount
      return minimum === undefined ? baseGoal : { ...baseGoal, minimumCount: minimum }
    }
    case 'repetitionsPerPeriod': {
      const baseGoal = { ...goalConfig }
      delete baseGoal.minimumRepetitions
      return minimum === undefined ? baseGoal : { ...baseGoal, minimumRepetitions: minimum }
    }
    case 'timePerSession': {
      const baseGoal = { ...goalConfig }
      delete baseGoal.minimumMinutes
      return minimum === undefined ? baseGoal : { ...baseGoal, minimumMinutes: minimum }
    }
    case 'totalTimePerPeriod': {
      const baseGoal = { ...goalConfig }
      delete baseGoal.minimumMinutes
      return minimum === undefined ? baseGoal : { ...baseGoal, minimumMinutes: minimum }
    }
    case 'quantityPerSession': {
      const baseGoal = { ...goalConfig }
      delete baseGoal.minimumQuantity
      return minimum === undefined ? baseGoal : { ...baseGoal, minimumQuantity: minimum }
    }
    case 'totalQuantityPerPeriod': {
      const baseGoal = { ...goalConfig }
      delete baseGoal.minimumQuantity
      return minimum === undefined ? baseGoal : { ...baseGoal, minimumQuantity: minimum }
    }
  }
}

function hasConfiguredMinimum(goalConfig: HabitGoalConfig, values: HabitEditValues) {
  return goalConfig.trackingType === 'binary'
    ? values.minimumText.trim().length > 0
    : values.minimumAmount > 0
}

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
    description: habit.description ?? '',
    notes: habit.notes ?? '',
    minimumText:
      habit.goalConfig.trackingType === 'binary' ? (habit.goalConfig.minimumDescription ?? '') : '',
    minimumAmount: getMinimumAmount(habit.goalConfig),
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
  today,
  archived,
  pending,
  onSave,
  onArchive,
  onRequestDangerAction,
}: HabitEditTabProps) {
  const intl = useIntl()
  const formSchema = useMemo(
    () => createHabitEditValuesSchema(habit.goalConfig),
    [habit.goalConfig],
  )
  const form = useForm<HabitEditValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValuesForHabit(habit),
  })
  const scheduleKind = form.watch('scheduleKind')
  const selectedDays = form.watch('daysOfWeek')
  const selectedPriority = form.watch('priority')
  const supportsFlexible = periodBasedTrackingTypes.has(habit.goalConfig.trackingType)
  const standardTarget = getStandardTargetForDisplay(habit.goalConfig)
  const minimumUnitLabel = getMinimumUnitLabel(habit.goalConfig)
  const nameInputId = useId()
  const minimumInputId = useId()

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
    const minimumConfigured = hasConfiguredMinimum(habit.goalConfig, values)

    onSave({
      id: habit.id,
      title: values.title.trim(),
      description: values.description.trim() || null,
      notes: values.notes.trim() || null,
      categoryId: values.categoryId || null,
      priority: values.priority,
      goalConfig: buildGoalConfigWithMinimum(habit.goalConfig, values),
      scheduleRule: buildSchedule(values),
      startsOn: values.startsOn,
      endsOn: values.endsOn || null,
      usesCompletionLevels: minimumConfigured,
      enabledCompletionLevels: minimumConfigured ? ['minimum', 'standard'] : ['standard'],
      defaultCompletionLevel: minimumConfigured ? 'standard' : null,
    }, { archiveAfterSave: Boolean(values.endsOn && values.endsOn < today) })
  })

  const inputClass = 'mt-1.5 rounded-xl border-border/75'
  const minimumError = form.formState.errors.minimumAmount?.message

  return (
    <div className="space-y-6">
      <form
        onSubmit={submit}
        noValidate
        className="space-y-5"
        aria-label={intl.formatMessage({ id: 'page.items.habit.edit.form' })}
      >
        <section className="space-y-4 rounded-[1.4rem] border border-border/70 bg-card/90 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {intl.formatMessage({ id: 'page.items.habit.edit.essentials' })}
          </p>
          <div className="block text-sm font-medium">
            <label htmlFor={nameInputId}>
              {intl.formatMessage({ id: 'page.items.habit.edit.name' })}
            </label>
            <Input id={nameInputId} {...form.register('title')} className={inputClass} />
            {form.formState.errors.title ? (
              <span className="mt-1 block text-xs text-amber-700">
                {intl.formatMessage({ id: 'page.items.habit.edit.error.name' })}
              </span>
            ) : null}
          </div>
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
                    onClick={() => toggleDay(day)}
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
              {form.formState.errors.daysOfWeek ? (
                <span className="text-xs text-amber-700">
                  {intl.formatMessage({ id: 'page.items.habit.edit.error.days' })}
                </span>
              ) : null}
            </fieldset>
          ) : null}

          {scheduleKind === 'everyXDays' ? (
            <label className="block text-sm font-medium">
              {intl.formatMessage({ id: 'page.items.habit.edit.intervalDays' })}
              <Input
                type="number"
                min={1}
                {...form.register('intervalDays', { valueAsNumber: true })}
                className={inputClass}
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
                className={inputClass}
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
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-medium">
                {intl.formatMessage({ id: 'page.items.habit.edit.dayOfMonth' })}
                <Input
                  type="number"
                  min={1}
                  max={31}
                  {...form.register('dayOfMonth', { valueAsNumber: true })}
                  className={inputClass}
                />
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
                  form.setValue('categoryId', value === noCategoryValue ? '' : value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
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
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
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
          </div>
          {habit.goalConfig.trackingType === 'binary' ? (
            <div className="block text-sm font-medium">
              <label htmlFor={minimumInputId}>
                {intl.formatMessage({ id: 'page.items.habit.edit.minimum' })}
              </label>
              <Input
                id={minimumInputId}
                type="text"
                {...form.register('minimumText')}
                className={inputClass}
                placeholder={intl.formatMessage({
                  id: 'page.items.habit.edit.minimumBinaryPlaceholder',
                })}
              />
              <span className="mt-1.5 block text-xs text-muted-foreground">
                {intl.formatMessage({ id: 'page.items.habit.edit.minimumBinaryHelp' })}
              </span>
            </div>
          ) : (
            <div className="block text-sm font-medium">
              <label htmlFor={minimumInputId}>
                {intl.formatMessage({ id: 'page.items.habit.edit.minimum' })}
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <Input
                  id={minimumInputId}
                  type="number"
                  min={0}
                  step="any"
                  {...form.register('minimumAmount', {
                    setValueAs: (value) => (value === '' ? 0 : Number(value)),
                  })}
                  aria-invalid={Boolean(form.formState.errors.minimumAmount)}
                  className="rounded-xl border-border/75"
                />
                {minimumUnitLabel ? (
                  <span className="shrink-0 rounded-full border border-border/70 bg-muted/45 px-3 py-2 text-xs font-medium text-muted-foreground">
                    {minimumUnitLabel}
                  </span>
                ) : null}
              </div>
              {minimumError ? (
                <span className="mt-1.5 block text-xs text-amber-700">
                  {intl.formatMessage(
                    {
                      id:
                        minimumError === 'negativeMinimum'
                          ? 'page.items.habit.edit.error.minimumNegative'
                          : 'page.items.habit.edit.error.minimumAboveStandard',
                    },
                    { standard: standardTarget },
                  )}
                </span>
              ) : null}
            </div>
          )}
          <label className="block text-sm font-medium">
            {intl.formatMessage({ id: 'page.items.habit.edit.description' })}
            <Textarea {...form.register('description')} rows={3} className={inputClass} />
          </label>
          <label className="block text-sm font-medium">
            {intl.formatMessage({ id: 'page.items.habit.edit.notes' })}
            <Textarea {...form.register('notes')} rows={3} className={inputClass} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <ReadOnlyStartDateField
              labelId="page.items.habit.edit.startsOn"
              value={form.watch('startsOn')}
              registration={form.register('startsOn')}
            />
            <GuardedEndDateField
              labelId="page.items.habit.edit.endsOn"
              registration={form.register('endsOn')}
              error={
                form.formState.errors.endsOn
                  ? intl.formatMessage({ id: 'page.items.habit.edit.error.endDate' })
                  : undefined
              }
              warningTitleId="page.items.habit.edit.endDateWarning.title"
              warningDescriptionId="page.items.habit.edit.endDateWarning.description"
            />
          </div>
        </section>

        <Button type="submit" className="w-full rounded-xl" disabled={archived || pending}>
          {intl.formatMessage({ id: 'page.items.habit.edit.save' })}
        </Button>
      </form>

      <section className="space-y-3 rounded-[1.4rem] border border-amber-200/75 bg-amber-50/55 p-4 dark:border-amber-900/70 dark:bg-amber-950/20">
        <h3 className="text-sm font-semibold">
          {intl.formatMessage({ id: 'page.items.habit.edit.dangerTitle' })}
        </h3>
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
          disabled={archived || pending}
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
