import { formatISO } from 'date-fns'
import { ArrowLeft, X } from 'lucide-react'
import { useState } from 'react'
import { useIntl } from 'react-intl'

import type { CreateCategoryInput } from '@/domain/categories'
import type {
  CreateHabitInput,
  HabitGoalConfig,
  HabitPeriod,
  HabitScheduleRule,
} from '@/domain/habits'
import type { CreateRecurrentTaskInput, DayOfWeek, RecurrenceRule } from '@/domain/recurrent-tasks'
import type { CreateTaskInput } from '@/domain/tasks'
import { useCategoriesQuery } from '@/features/categories/hooks/useCategoriesQuery'
import { useCreateCategoryMutation } from '@/features/categories/hooks/useCategoryMutations'
import { useCreateHabitMutation } from '@/features/habits/hooks/useHabitDetailMutations'
import { useHabitsQuery } from '@/features/habits/hooks/useHabitsQuery'
import { useCreateRecurrentTaskMutation } from '@/features/recurrent-tasks/hooks/useRecurrentTaskMutations'
import { useRecurrentTasksQuery } from '@/features/recurrent-tasks/hooks/useRecurrentTasksQuery'
import { useCreateTaskMutation } from '@/features/tasks/hooks/useTaskMutations'
import { useTasksQuery } from '@/features/tasks/hooks/useTasksQuery'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import { habitPriorities, itemPriorities } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { cn } from '@/shared/utils/cn'

import {
  isValidDaysOfMonthInput,
  isValidDaysOfYearInput,
  parseDaysOfMonthInput,
  parseDaysOfYearInput,
} from '../components/scheduleInputParsers'
import { DatePickerField } from '../components/ItemDateFields'

type CreateKind = 'habit' | 'task' | 'recurrentTask' | 'category'
type FrequencyKind =
  | 'daily'
  | 'timesPerPeriod'
  | 'specificDaysOfWeek'
  | 'specificDaysOfMonth'
  | 'specificDaysOfYear'
  | 'everyXDays'
  | 'everyXWeeks'
  | 'everyXMonths'
  | 'firstWeekdayOfMonth'

type FrequencyValues = {
  kind: FrequencyKind
  daysOfWeek: DayOfWeek[]
  daysOfMonth: string
  daysOfYear: string
  interval: number
  dayOfMonth: number
  weekday: DayOfWeek
  period: Exclude<HabitPeriod, 'custom'>
  targetCount: number
}

const inputClass = 'mt-1.5 rounded-xl border-border/75'
const weekdayValues = [0, 1, 2, 3, 4, 5, 6] as const
const frequencyKinds: FrequencyKind[] = [
  'daily',
  'timesPerPeriod',
  'specificDaysOfWeek',
  'specificDaysOfMonth',
  'specificDaysOfYear',
  'everyXDays',
  'everyXWeeks',
  'everyXMonths',
  'firstWeekdayOfMonth',
]
const recurrentFrequencyKinds = frequencyKinds.filter((kind) => kind !== 'timesPerPeriod')
const colorTokens = ['emerald', 'sky'] as const
const iconNames = ['heart', 'book-open', 'tag'] as const

const todayAsISODate = () => {
  return formatISO(new Date(), { representation: 'date' })
}

const initialFrequency = (): FrequencyValues => {
  return {
    kind: 'daily',
    daysOfWeek: [],
    daysOfMonth: '1',
    daysOfYear: '01-01',
    interval: 1,
    dayOfMonth: 1,
    weekday: 1,
    period: 'week',
    targetCount: 3,
  }
}

const buildSchedule = (frequency: FrequencyValues): HabitScheduleRule => {
  switch (frequency.kind) {
    case 'daily':
      return { kind: 'daily' }
    case 'timesPerPeriod':
      return { kind: 'flexiblePeriod' }
    case 'specificDaysOfWeek':
      return { kind: 'specificDaysOfWeek', daysOfWeek: frequency.daysOfWeek }
    case 'specificDaysOfMonth':
      return {
        kind: 'specificDaysOfMonth',
        daysOfMonth: parseDaysOfMonthInput(frequency.daysOfMonth),
      }
    case 'specificDaysOfYear':
      return { kind: 'specificDaysOfYear', daysOfYear: parseDaysOfYearInput(frequency.daysOfYear) }
    case 'everyXDays':
      return { kind: 'everyXDays', intervalDays: frequency.interval }
    case 'everyXWeeks':
      return {
        kind: 'everyXWeeks',
        intervalWeeks: frequency.interval,
        daysOfWeek: frequency.daysOfWeek,
      }
    case 'everyXMonths':
      return {
        kind: 'everyXMonths',
        intervalMonths: frequency.interval,
        dayOfMonth: frequency.dayOfMonth,
      }
    case 'firstWeekdayOfMonth':
      return { kind: 'firstWeekdayOfMonth', weekday: frequency.weekday }
  }
}

const buildRecurrence = (frequency: FrequencyValues): RecurrenceRule => {
  const schedule = buildSchedule(frequency)
  switch (schedule.kind) {
    case 'daily':
      return schedule
    case 'specificDaysOfWeek':
      return { ...schedule, daysOfWeek: [...schedule.daysOfWeek] }
    case 'specificDaysOfMonth':
      return { ...schedule, daysOfMonth: [...schedule.daysOfMonth] }
    case 'specificDaysOfYear':
      return { ...schedule, daysOfYear: [...schedule.daysOfYear] }
    case 'everyXDays':
    case 'everyXMonths':
    case 'firstWeekdayOfMonth':
      return schedule
    case 'everyXWeeks':
      return { ...schedule, daysOfWeek: [...schedule.daysOfWeek] }
    case 'flexiblePeriod':
      return { kind: 'daily' }
  }
}

const validateFrequency = (frequency: FrequencyValues) => {
  if (
    (frequency.kind === 'specificDaysOfWeek' || frequency.kind === 'everyXWeeks') &&
    frequency.daysOfWeek.length === 0
  ) {
    return false
  }
  if (frequency.kind === 'specificDaysOfMonth' && !isValidDaysOfMonthInput(frequency.daysOfMonth)) {
    return false
  }
  if (frequency.kind === 'specificDaysOfYear' && !isValidDaysOfYearInput(frequency.daysOfYear)) {
    return false
  }
  if (frequency.kind.startsWith('everyX') && frequency.interval < 1) {
    return false
  }
  const maximum =
    frequency.period === 'week'
      ? 7
      : frequency.period === 'month'
        ? 28
        : frequency.period === 'year'
          ? 365
          : 1
  return (
    frequency.kind !== 'timesPerPeriod' ||
    (frequency.targetCount >= 1 && frequency.targetCount <= maximum)
  )
}

const DialogFrame = ({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) => {
  const intl = useIntl()
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="fixed inset-0 left-0 top-0 flex h-full w-full max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-0 bg-background p-0 shadow-2xl md:left-1/2 md:top-1/2 md:max-h-[min(92vh,52rem)] md:max-w-xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[1.7rem] md:border md:border-border/75"
      >
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-xl font-semibold tracking-tight">{title}</DialogTitle>
            <Button
              variant="ghost"
              className="size-10 rounded-full border border-border/70 p-0"
              aria-label={intl.formatMessage({ id: 'action.close' })}
              onClick={onClose}
            >
              <X aria-hidden="true" size={18} />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">{children}</div>
      </DialogContent>
    </Dialog>
  )
}

const ErrorText = ({ children }: { children: string }) => {
  return <p className="mt-1 text-xs text-amber-700">{children}</p>
}

const WeekdayPicker = ({
  value,
  onChange,
}: {
  value: DayOfWeek[]
  onChange: (value: DayOfWeek[]) => void
}) => {
  const intl = useIntl()
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">
        {intl.formatMessage({ id: 'page.items.create.frequency.weekdays' })}
      </legend>
      <div className="flex flex-wrap gap-2">
        {weekdayValues.map((day) => (
          <Button
            key={day}
            type="button"
            variant="ghost"
            aria-pressed={value.includes(day)}
            className={cn(
              'rounded-full border border-border/75 px-3 py-2 text-xs',
              value.includes(day) && 'border-primary bg-primary text-primary-foreground',
            )}
            onClick={() =>
              onChange(
                value.includes(day)
                  ? value.filter((entry) => entry !== day)
                  : [...value, day].sort(),
              )
            }
          >
            {intl.formatMessage({ id: `page.items.weekday.short.${day}` })}
          </Button>
        ))}
      </div>
    </fieldset>
  )
}

const FrequencyFields = ({
  value,
  onChange,
  includeTimesPerPeriod,
}: {
  value: FrequencyValues
  onChange: (value: FrequencyValues) => void
  includeTimesPerPeriod: boolean
}) => {
  const intl = useIntl()
  const kinds = includeTimesPerPeriod ? frequencyKinds : recurrentFrequencyKinds
  return (
    <div className="flex flex-col gap-4">
      <label className="text-sm font-medium">
        {intl.formatMessage({ id: 'page.items.create.frequency.label' })}
        <Select
          value={value.kind}
          onValueChange={(kind) => onChange({ ...value, kind: kind as FrequencyKind })}
        >
          <SelectTrigger className={inputClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {kinds.map((kind) => (
              <SelectItem key={kind} value={kind}>
                {intl.formatMessage({ id: `page.items.create.frequency.${kind}` })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      {value.kind === 'timesPerPeriod' ? (
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-medium">
            {intl.formatMessage({ id: 'page.items.create.frequency.count' })}
            <Input
              type="number"
              min={1}
              value={value.targetCount}
              onChange={(event) => onChange({ ...value, targetCount: Number(event.target.value) })}
              className={inputClass}
            />
          </label>
          <PeriodSelect
            value={value.period}
            onChange={(period) => onChange({ ...value, period })}
          />
        </div>
      ) : null}
      {value.kind === 'specificDaysOfWeek' || value.kind === 'everyXWeeks' ? (
        <WeekdayPicker
          value={value.daysOfWeek}
          onChange={(daysOfWeek) => onChange({ ...value, daysOfWeek })}
        />
      ) : null}
      {value.kind === 'specificDaysOfMonth' ? (
        <label className="text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.create.frequency.monthDays' })}
          <Input
            value={value.daysOfMonth}
            onChange={(event) => onChange({ ...value, daysOfMonth: event.target.value })}
            placeholder="1, 15, 28"
            className={inputClass}
          />
        </label>
      ) : null}
      {value.kind === 'specificDaysOfYear' ? (
        <label className="text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.create.frequency.yearDays' })}
          <Input
            value={value.daysOfYear}
            onChange={(event) => onChange({ ...value, daysOfYear: event.target.value })}
            placeholder="01-01, 03-15"
            className={inputClass}
          />
        </label>
      ) : null}
      {value.kind.startsWith('everyX') ? (
        <label className="text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.create.frequency.interval' })}
          <Input
            type="number"
            min={1}
            value={value.interval}
            onChange={(event) => onChange({ ...value, interval: Number(event.target.value) })}
            className={inputClass}
          />
        </label>
      ) : null}
      {value.kind === 'everyXMonths' ? (
        <label className="text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.create.frequency.dayOfMonth' })}
          <Input
            type="number"
            min={1}
            max={31}
            value={value.dayOfMonth}
            onChange={(event) => onChange({ ...value, dayOfMonth: Number(event.target.value) })}
            className={inputClass}
          />
        </label>
      ) : null}
      {value.kind === 'firstWeekdayOfMonth' ? (
        <WeekdaySelect
          value={value.weekday}
          onChange={(weekday) => onChange({ ...value, weekday })}
        />
      ) : null}
    </div>
  )
}

const PeriodSelect = ({
  value,
  onChange,
  includeDay = false,
}: {
  value: HabitPeriod
  onChange: (value: Exclude<HabitPeriod, 'custom'>) => void
  includeDay?: boolean
}) => {
  const intl = useIntl()
  const periods = includeDay ? ['day', 'week', 'month', 'year'] : ['week', 'month', 'year']
  return (
    <label className="text-sm font-medium">
      {intl.formatMessage({ id: 'page.items.create.frequency.period' })}
      <Select
        value={value}
        onValueChange={(period) => onChange(period as Exclude<HabitPeriod, 'custom'>)}
      >
        <SelectTrigger className={inputClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {periods.map((period) => (
            <SelectItem key={period} value={period}>
              {intl.formatMessage({ id: `items.period.${period}` })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}

const WeekdaySelect = ({
  value,
  onChange,
}: {
  value: DayOfWeek
  onChange: (value: DayOfWeek) => void
}) => {
  const intl = useIntl()
  return (
    <label className="text-sm font-medium">
      {intl.formatMessage({ id: 'page.items.create.frequency.weekday' })}
      <Select value={String(value)} onValueChange={(day) => onChange(Number(day) as DayOfWeek)}>
        <SelectTrigger className={inputClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {weekdayValues.map((day) => (
            <SelectItem key={day} value={String(day)}>
              {intl.formatMessage({ id: `page.items.weekday.long.${day}` })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}

const ActiveCategorySelect = ({
  value,
  onChange,
  required = false,
}: {
  value: string
  onChange: (value: string) => void
  required?: boolean
}) => {
  const intl = useIntl()
  const categories =
    useCategoriesQuery().data?.filter((category) => category.lifecycleStatus === 'active') ?? []
  return (
    <label className="text-sm font-medium">
      {intl.formatMessage({ id: 'page.items.create.details.category' })}
      <Select
        value={value || '__none__'}
        onValueChange={(categoryId) => onChange(categoryId === '__none__' ? '' : categoryId)}
      >
        <SelectTrigger className={inputClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {!required ? (
            <SelectItem value="__none__">
              {intl.formatMessage({ id: 'page.items.create.details.noCategory' })}
            </SelectItem>
          ) : null}
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}

const HabitCreate = ({ onClose }: { onClose: () => void }) => {
  const intl = useIntl()
  const mutation = useCreateHabitMutation()
  const habits = useHabitsQuery().data ?? []
  const [step, setStep] = useState(1)
  const [completionMode, setCompletionMode] = useState<'binary' | 'measurable'>('binary')
  const [measurableKind, setMeasurableKind] = useState<'quantity' | 'time'>('quantity')
  const [scope, setScope] = useState<'session' | 'period'>('session')
  const [period, setPeriod] = useState<Exclude<HabitPeriod, 'custom'>>('week')
  const [standardText, setStandardText] = useState('')
  const [minimumText, setMinimumText] = useState('')
  const [standardAmount, setStandardAmount] = useState(1)
  const [minimumAmount, setMinimumAmount] = useState<number | ''>('')
  const [unitLabel, setUnitLabel] = useState('')
  const [frequency, setFrequency] = useState(initialFrequency)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState<CreateHabitInput['priority']>('medium')
  const [startsOn, setStartsOn] = useState(todayAsISODate)
  const [endsOn, setEndsOn] = useState('')
  const [error, setError] = useState('')

  const buildGoal = (): HabitGoalConfig => {
    if (completionMode === 'binary') {
      if (frequency.kind === 'timesPerPeriod') {
        return {
          trackingType: 'timesPerPeriod',
          period: frequency.period,
          targetCount: frequency.targetCount,
        }
      }
      return {
        trackingType: 'binary',
        ...(standardText.trim() ? { standardDescription: standardText.trim() } : {}),
        ...(minimumText.trim() ? { minimumDescription: minimumText.trim() } : {}),
      }
    }
    const minimum = minimumAmount !== '' && minimumAmount > 0 ? minimumAmount : undefined
    if (measurableKind === 'time') {
      return scope === 'session'
        ? {
            trackingType: 'timePerSession',
            targetMinutes: standardAmount,
            ...(minimum ? { minimumMinutes: minimum } : {}),
          }
        : {
            trackingType: 'totalTimePerPeriod',
            period,
            targetMinutes: standardAmount,
            ...(minimum ? { minimumMinutes: minimum } : {}),
          }
    }
    return scope === 'session'
      ? {
          trackingType: 'quantityPerSession',
          targetQuantity: standardAmount,
          unitLabel: unitLabel.trim(),
          ...(minimum ? { minimumQuantity: minimum } : {}),
        }
      : {
          trackingType: 'totalQuantityPerPeriod',
          period,
          targetQuantity: standardAmount,
          unitLabel: unitLabel.trim(),
          ...(minimum ? { minimumQuantity: minimum } : {}),
        }
  }

  const continueFlow = () => {
    setError('')
    if (
      step === 1 &&
      completionMode === 'measurable' &&
      (standardAmount <= 0 ||
        (minimumAmount !== '' && minimumAmount < 0) ||
        (minimumAmount !== '' && minimumAmount > standardAmount) ||
        (measurableKind === 'quantity' && !unitLabel.trim()))
    ) {
      setError(intl.formatMessage({ id: 'page.items.create.error.completion' }))
      return
    }
    if (step === 2 && scope !== 'period' && !validateFrequency(frequency)) {
      setError(intl.formatMessage({ id: 'page.items.create.error.frequency' }))
      return
    }
    setStep((current) => current + 1)
  }

  const submit = () => {
    if (!title.trim() || !categoryId || (endsOn && endsOn < startsOn)) {
      setError(intl.formatMessage({ id: 'page.items.create.error.details' }))
      return
    }
    const goalConfig = buildGoal()
    const minimumConfigured =
      goalConfig.trackingType === 'binary'
        ? Boolean(goalConfig.minimumDescription)
        : minimumAmount !== '' && minimumAmount > 0
    mutation.mutate(
      {
        userId: MOCK_USER_ID,
        title: title.trim(),
        description: description.trim() || null,
        notes: null,
        lifecycleStatus: 'active',
        categoryId,
        priority,
        startsOn,
        endsOn: endsOn || null,
        order: habits.length,
        scheduleRule:
          completionMode === 'measurable' && scope === 'period'
            ? { kind: 'flexiblePeriod' }
            : buildSchedule(frequency),
        trackingType: goalConfig.trackingType,
        goalConfig,
        usesCompletionLevels: minimumConfigured,
        enabledCompletionLevels: minimumConfigured ? ['minimum', 'standard'] : ['standard'],
        defaultCompletionLevel: minimumConfigured ? 'standard' : null,
        resetMode: 'soft',
      },
      { onSuccess: onClose },
    )
  }

  return (
    <DialogFrame
      title={intl.formatMessage({ id: 'page.items.create.habit.title' })}
      onClose={onClose}
    >
      <div className="flex flex-col gap-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {intl.formatMessage({ id: 'page.items.create.step' }, { step, total: 3 })}
        </p>
        {step === 1 ? (
          <section className="flex flex-col gap-4 rounded-[1.4rem] border border-border/70 bg-card/90 p-4">
            <label className="text-sm font-medium">
              {intl.formatMessage({ id: 'page.items.create.habit.completionType' })}
              <Select
                value={completionMode}
                onValueChange={(value) => setCompletionMode(value as typeof completionMode)}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="binary">
                    {intl.formatMessage({ id: 'page.items.create.habit.binary' })}
                  </SelectItem>
                  <SelectItem value="measurable">
                    {intl.formatMessage({ id: 'page.items.create.habit.measurable' })}
                  </SelectItem>
                </SelectContent>
              </Select>
            </label>
            {completionMode === 'binary' ? (
              <>
                <label className="text-sm font-medium">
                  {intl.formatMessage({ id: 'page.items.create.habit.standardText' })}
                  <Input
                    value={standardText}
                    onChange={(event) => setStandardText(event.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="text-sm font-medium">
                  {intl.formatMessage({ id: 'page.items.create.habit.minimumText' })}
                  <Input
                    value={minimumText}
                    onChange={(event) => setMinimumText(event.target.value)}
                    className={inputClass}
                  />
                </label>
              </>
            ) : (
              <>
                <label className="text-sm font-medium">
                  {intl.formatMessage({ id: 'page.items.create.habit.measureKind' })}
                  <Select
                    value={measurableKind}
                    onValueChange={(value) => setMeasurableKind(value as typeof measurableKind)}
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quantity">
                        {intl.formatMessage({ id: 'page.items.create.habit.quantity' })}
                      </SelectItem>
                      <SelectItem value="time">
                        {intl.formatMessage({ id: 'page.items.create.habit.time' })}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </label>
                <label className="text-sm font-medium">
                  {intl.formatMessage({ id: 'page.items.create.habit.scope' })}
                  <Select value={scope} onValueChange={(value) => setScope(value as typeof scope)}>
                    <SelectTrigger className={inputClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="session">
                        {intl.formatMessage({ id: 'page.items.create.habit.session' })}
                      </SelectItem>
                      <SelectItem value="period">
                        {intl.formatMessage({ id: 'page.items.create.habit.period' })}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </label>
                {scope === 'period' ? (
                  <PeriodSelect value={period} includeDay onChange={setPeriod} />
                ) : null}
                <label className="text-sm font-medium">
                  {intl.formatMessage({ id: 'page.items.create.habit.standardAmount' })}
                  <Input
                    type="number"
                    min={1}
                    value={standardAmount}
                    onChange={(event) => setStandardAmount(Number(event.target.value))}
                    className={inputClass}
                  />
                </label>
                <label className="text-sm font-medium">
                  {intl.formatMessage({ id: 'page.items.create.habit.minimumAmount' })}
                  <Input
                    type="number"
                    min={0}
                    value={minimumAmount}
                    onChange={(event) =>
                      setMinimumAmount(event.target.value === '' ? '' : Number(event.target.value))
                    }
                    className={inputClass}
                  />
                </label>
                {measurableKind === 'quantity' ? (
                  <label className="text-sm font-medium">
                    {intl.formatMessage({ id: 'page.items.create.habit.unit' })}
                    <Input
                      value={unitLabel}
                      onChange={(event) => setUnitLabel(event.target.value)}
                      className={inputClass}
                    />
                  </label>
                ) : null}
              </>
            )}
          </section>
        ) : null}
        {step === 2 ? (
          <section className="flex flex-col gap-4 rounded-[1.4rem] border border-border/70 bg-card/90 p-4">
            {completionMode === 'measurable' && scope === 'period' ? (
              <p className="text-sm text-muted-foreground">
                {intl.formatMessage(
                  { id: 'page.items.create.habit.flexiblePeriodHelp' },
                  { period: intl.formatMessage({ id: `items.period.${period}` }) },
                )}
              </p>
            ) : (
              <FrequencyFields
                value={frequency}
                onChange={setFrequency}
                includeTimesPerPeriod={completionMode === 'binary'}
              />
            )}
          </section>
        ) : null}
        {step === 3 ? (
          <section className="flex flex-col gap-4 rounded-[1.4rem] border border-border/70 bg-card/90 p-4">
            <label className="text-sm font-medium">
              {intl.formatMessage({ id: 'page.items.create.details.name' })}
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-medium">
              {intl.formatMessage({ id: 'page.items.create.details.description' })}
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className={inputClass}
              />
            </label>
            <ActiveCategorySelect value={categoryId} onChange={setCategoryId} required />
            <label className="text-sm font-medium">
              {intl.formatMessage({ id: 'page.items.create.details.priority' })}
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as typeof priority)}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {habitPriorities.map((value) => (
                    <SelectItem key={value} value={value}>
                      {intl.formatMessage({ id: `page.items.priority.${value}` })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <DatePickerField
              labelId="page.items.create.details.startsOn"
              value={startsOn}
              onValueChange={setStartsOn}
            />
            <DatePickerField
              labelId="page.items.create.details.endsOn"
              value={endsOn}
              onValueChange={setEndsOn}
              allowClear
            />
          </section>
        ) : null}
        {error ? <ErrorText>{error}</ErrorText> : null}
        <div className="flex gap-3">
          {step > 1 ? (
            <Button type="button" variant="ghost" onClick={() => setStep((current) => current - 1)}>
              <ArrowLeft aria-hidden="true" size={16} />
              {intl.formatMessage({ id: 'page.items.create.back' })}
            </Button>
          ) : null}
          <Button
            type="button"
            className="ml-auto"
            disabled={mutation.isPending}
            onClick={step === 3 ? submit : continueFlow}
          >
            {intl.formatMessage({
              id: step === 3 ? 'page.items.create.save' : 'page.items.create.continue',
            })}
          </Button>
        </div>
      </div>
    </DialogFrame>
  )
}

const TaskCreate = ({ onClose }: { onClose: () => void }) => {
  const intl = useIntl()
  const mutation = useCreateTaskMutation()
  const tasks = useTasksQuery().data ?? []
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState(todayAsISODate)
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState<CreateTaskInput['priority']>('medium')
  const [description, setDescription] = useState('')
  const [carryForward, setCarryForward] = useState(true)
  const [error, setError] = useState('')
  const submit = () => {
    if (!title.trim() || !dueDate) {
      setError(intl.formatMessage({ id: 'page.items.create.error.details' }))
      return
    }
    mutation.mutate(
      {
        userId: MOCK_USER_ID,
        title: title.trim(),
        dueDate,
        categoryId: categoryId || null,
        priority,
        description: description.trim() || null,
        notes: null,
        carryForward,
        order: tasks.length,
        lifecycleStatus: 'active',
        completionStatus: 'pending',
        completedAt: null,
      },
      { onSuccess: onClose },
    )
  }
  return (
    <DialogFrame
      title={intl.formatMessage({ id: 'page.items.create.task.title' })}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <label className="text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.create.details.name' })}
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={inputClass}
          />
        </label>
        <DatePickerField
          labelId="page.items.create.task.date"
          value={dueDate}
          onValueChange={setDueDate}
        />
        <ActiveCategorySelect value={categoryId} onChange={setCategoryId} />
        <label className="text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.create.details.priority' })}
          <Select value={priority} onValueChange={(value) => setPriority(value as typeof priority)}>
            <SelectTrigger className={inputClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {itemPriorities.map((value) => (
                <SelectItem key={value} value={value}>
                  {intl.formatMessage({ id: `page.items.priority.${value}` })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.create.details.description' })}
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-border/65 bg-muted/35 p-3 text-sm">
          <span>{intl.formatMessage({ id: 'page.items.create.task.carryForward' })}</span>
          <Checkbox
            checked={carryForward}
            onChange={(event) => setCarryForward(event.target.checked)}
          />
        </label>
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button onClick={submit} disabled={mutation.isPending}>
          {intl.formatMessage({ id: 'page.items.create.save' })}
        </Button>
      </div>
    </DialogFrame>
  )
}

const RecurrentTaskCreate = ({ onClose }: { onClose: () => void }) => {
  const intl = useIntl()
  const mutation = useCreateRecurrentTaskMutation()
  const tasks = useRecurrentTasksQuery().data ?? []
  const [step, setStep] = useState(1)
  const [frequency, setFrequency] = useState(initialFrequency)
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState<CreateRecurrentTaskInput['priority']>('medium')
  const [description, setDescription] = useState('')
  const [startsOn, setStartsOn] = useState(todayAsISODate)
  const [endsOn, setEndsOn] = useState('')
  const [carryForward, setCarryForward] = useState(true)
  const [error, setError] = useState('')
  const continueFlow = () =>
    validateFrequency(frequency)
      ? setStep(2)
      : setError(intl.formatMessage({ id: 'page.items.create.error.frequency' }))
  const submit = () => {
    if (!title.trim() || (endsOn && endsOn < startsOn)) {
      setError(intl.formatMessage({ id: 'page.items.create.error.details' }))
      return
    }
    mutation.mutate(
      {
        userId: MOCK_USER_ID,
        title: title.trim(),
        recurrenceRule: buildRecurrence(frequency),
        categoryId: categoryId || null,
        priority,
        carryForward,
        description: description.trim() || null,
        notes: null,
        startsOn,
        endsOn: endsOn || null,
        order: tasks.length,
        lifecycleStatus: 'active',
      },
      { onSuccess: onClose },
    )
  }
  return (
    <DialogFrame
      title={intl.formatMessage({ id: 'page.items.create.recurrent.title' })}
      onClose={onClose}
    >
      <div className="flex flex-col gap-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {intl.formatMessage({ id: 'page.items.create.step' }, { step, total: 2 })}
        </p>
        {step === 1 ? (
          <section className="rounded-[1.4rem] border border-border/70 bg-card/90 p-4">
            <FrequencyFields
              value={frequency}
              onChange={setFrequency}
              includeTimesPerPeriod={false}
            />
          </section>
        ) : (
          <section className="flex flex-col gap-4 rounded-[1.4rem] border border-border/70 bg-card/90 p-4">
            <label className="text-sm font-medium">
              {intl.formatMessage({ id: 'page.items.create.details.name' })}
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className={inputClass}
              />
            </label>
            <ActiveCategorySelect value={categoryId} onChange={setCategoryId} />
            <label className="text-sm font-medium">
              {intl.formatMessage({ id: 'page.items.create.details.priority' })}
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as typeof priority)}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {itemPriorities.map((value) => (
                    <SelectItem key={value} value={value}>
                      {intl.formatMessage({ id: `page.items.priority.${value}` })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="text-sm font-medium">
              {intl.formatMessage({ id: 'page.items.create.details.description' })}
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className={inputClass}
              />
            </label>
            <DatePickerField
              labelId="page.items.create.details.startsOn"
              value={startsOn}
              onValueChange={setStartsOn}
            />
            <DatePickerField
              labelId="page.items.create.details.endsOn"
              value={endsOn}
              onValueChange={setEndsOn}
              allowClear
            />
            <label className="flex items-center justify-between gap-3 rounded-xl border border-border/65 bg-muted/35 p-3 text-sm">
              <span>{intl.formatMessage({ id: 'page.items.create.task.carryForward' })}</span>
              <Checkbox
                checked={carryForward}
                onChange={(event) => setCarryForward(event.target.checked)}
              />
            </label>
          </section>
        )}
        {error ? <ErrorText>{error}</ErrorText> : null}
        <div className="flex gap-3">
          {step === 2 ? (
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft aria-hidden="true" size={16} />
              {intl.formatMessage({ id: 'page.items.create.back' })}
            </Button>
          ) : null}
          <Button
            className="ml-auto"
            onClick={step === 1 ? continueFlow : submit}
            disabled={mutation.isPending}
          >
            {intl.formatMessage({
              id: step === 1 ? 'page.items.create.continue' : 'page.items.create.save',
            })}
          </Button>
        </div>
      </div>
    </DialogFrame>
  )
}

const CategoryCreate = ({ onClose }: { onClose: () => void }) => {
  const intl = useIntl()
  const mutation = useCreateCategoryMutation()
  const categories = useCategoriesQuery().data ?? []
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [iconName, setIconName] = useState<string>('tag')
  const [colorToken, setColorToken] = useState<string>('emerald')
  const [error, setError] = useState('')
  const submit = () => {
    if (!name.trim() || !iconName || !colorToken) {
      setError(intl.formatMessage({ id: 'page.items.create.error.details' }))
      return
    }
    const input: CreateCategoryInput = {
      userId: MOCK_USER_ID,
      name: name.trim(),
      description: description.trim() || null,
      iconName,
      colorToken,
      order: categories.length,
      lifecycleStatus: 'active',
      isDefault: false,
    }
    mutation.mutate(input, { onSuccess: onClose })
  }
  return (
    <DialogFrame
      title={intl.formatMessage({ id: 'page.items.create.category.title' })}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <label className="text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.create.details.name' })}
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.create.details.description' })}
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.create.category.icon' })}
          <Select value={iconName} onValueChange={setIconName}>
            <SelectTrigger className={inputClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {iconNames.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.create.category.color' })}
          <Select value={colorToken} onValueChange={setColorToken}>
            <SelectTrigger className={inputClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {colorTokens.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button onClick={submit} disabled={mutation.isPending}>
          {intl.formatMessage({ id: 'page.items.create.save' })}
        </Button>
      </div>
    </DialogFrame>
  )
}

export const CreateItemDialogs = ({
  kind,
  onClose,
}: {
  kind: CreateKind | null
  onClose: () => void
}) => {
  if (kind === 'habit') return <HabitCreate onClose={onClose} />
  if (kind === 'task') return <TaskCreate onClose={onClose} />
  if (kind === 'recurrentTask') return <RecurrentTaskCreate onClose={onClose} />
  if (kind === 'category') return <CategoryCreate onClose={onClose} />
  return null
}
