import type { Category } from '@/domain/categories'
import type {
  Habit,
  HabitDayOfWeek,
  HabitGoalConfig,
  HabitScheduleRule,
  UpdateHabitInput,
} from '@/domain/habits'

import { parseDaysOfMonthInput, parseDaysOfYearInput } from '../components/scheduleInputParsers'
import type { HabitEditValues } from './habitEdit.schema'

const getStandardTarget = (goalConfig: Exclude<HabitGoalConfig, { trackingType: 'binary' }>) => {
  switch (goalConfig.trackingType) {
    case 'measurablePerSession':
    case 'totalMeasurablePerPeriod':
      return goalConfig.targetAmount
  }
}
const getMinimumAmount = (goalConfig: HabitGoalConfig) => {
  switch (goalConfig.trackingType) {
    case 'binary':
      return 0
    case 'measurablePerSession':
    case 'totalMeasurablePerPeriod':
      return goalConfig.minimumAmount ?? 0
  }
}

const getStandardTargetForDisplay = (goalConfig: HabitGoalConfig) => {
  return goalConfig.trackingType === 'binary' ? null : getStandardTarget(goalConfig)
}

const periodConfig = (values: HabitEditValues) => {
  return {
    period: values.period,
    ...(values.period === 'custom' ? { customPeriodDays: values.customPeriodDays } : {}),
  }
}

export const getMinimumUnitLabel = (
  trackingType: HabitEditValues['trackingType'],
  unitLabel: string,
) => {
  switch (trackingType) {
    case 'measurablePerSession':
    case 'totalMeasurablePerPeriod':
      return unitLabel
    default:
      return ''
  }
}

export const buildHabitGoalConfig = (values: HabitEditValues): HabitGoalConfig => {
  if (values.trackingType === 'binary') {
    const standardDescription = values.standardText.trim()
    const minimumDescription = values.minimumText.trim()
    return {
      trackingType: 'binary',
      ...(standardDescription ? { standardDescription } : {}),
      ...(minimumDescription ? { minimumDescription } : {}),
    }
  }

  const minimum = values.minimumAmount > 0 ? values.minimumAmount : undefined

  switch (values.trackingType) {
    case 'measurablePerSession':
      return {
        trackingType: 'measurablePerSession',
        targetAmount: values.standardAmount,
        unitLabel: values.unitLabel.trim(),
        ...(minimum ? { minimumAmount: minimum } : {}),
      }
    case 'totalMeasurablePerPeriod':
      return {
        trackingType: 'totalMeasurablePerPeriod',
        ...periodConfig(values),
        targetAmount: values.standardAmount,
        unitLabel: values.unitLabel.trim(),
        ...(minimum ? { minimumAmount: minimum } : {}),
      }
  }
}

export const hasConfiguredMinimum = (values: HabitEditValues) => {
  return values.trackingType === 'binary'
    ? values.minimumText.trim().length > 0
    : values.minimumAmount > 0
}

export const valuesForHabit = (habit: Habit): HabitEditValues => {
  const schedule = habit.scheduleRule
  const minimumAmount = getMinimumAmount(habit.goalConfig)

  return {
    title: habit.title,
    categoryId: habit.categoryId ?? '',
    priority: habit.priority,
    scheduleKind: schedule.kind,
    daysOfWeek:
      schedule.kind === 'specificDaysOfWeek' || schedule.kind === 'everyXWeeks'
        ? [...schedule.daysOfWeek]
        : [],
    daysOfMonth: schedule.kind === 'specificDaysOfMonth' ? schedule.daysOfMonth.join(', ') : '1',
    daysOfYear:
      schedule.kind === 'specificDaysOfYear'
        ? schedule.daysOfYear.map(({ month, day }) => `${month}-${day}`).join(', ')
        : '1-1',
    intervalDays: schedule.kind === 'everyXDays' ? schedule.intervalDays : 2,
    intervalWeeks: schedule.kind === 'everyXWeeks' ? schedule.intervalWeeks : 1,
    intervalMonths: schedule.kind === 'everyXMonths' ? schedule.intervalMonths : 1,
    dayOfMonth: schedule.kind === 'everyXMonths' ? schedule.dayOfMonth : 1,
    weekday: schedule.kind === 'firstWeekdayOfMonth' ? schedule.weekday : 1,
    targetDays: schedule.kind === 'certainDaysPerPeriod' ? schedule.targetDays : 3,
    frequencyPeriod: schedule.kind === 'certainDaysPerPeriod' ? schedule.period : 'week',
    startsOn: habit.startsOn,
    endsOn: habit.endsOn ?? '',
    description: habit.description ?? '',
    notes: habit.notes ?? '',
    trackingType: habit.goalConfig.trackingType,
    standardText:
      habit.goalConfig.trackingType === 'binary'
        ? (habit.goalConfig.standardDescription ?? '')
        : '',
    standardAmount: getStandardTargetForDisplay(habit.goalConfig) ?? 1,
    minimumText:
      habit.goalConfig.trackingType === 'binary' ? (habit.goalConfig.minimumDescription ?? '') : '',
    minimumAmount: minimumAmount > 0 ? minimumAmount : (undefined as unknown as number),
    unitLabel:
      habit.goalConfig.trackingType === 'measurablePerSession' ||
      habit.goalConfig.trackingType === 'totalMeasurablePerPeriod'
        ? habit.goalConfig.unitLabel
        : '',
    period: 'period' in habit.goalConfig ? habit.goalConfig.period : 'week',
    customPeriodDays:
      'customPeriodDays' in habit.goalConfig ? (habit.goalConfig.customPeriodDays ?? 1) : 1,
  }
}

export const buildHabitSchedule = (values: HabitEditValues): HabitScheduleRule => {
  switch (values.scheduleKind) {
    case 'daily':
      return { kind: 'daily' }
    case 'specificDaysOfWeek':
      return { kind: 'specificDaysOfWeek', daysOfWeek: values.daysOfWeek as HabitDayOfWeek[] }
    case 'specificDaysOfMonth':
      return {
        kind: 'specificDaysOfMonth',
        daysOfMonth: parseDaysOfMonthInput(values.daysOfMonth),
      }
    case 'specificDaysOfYear':
      return {
        kind: 'specificDaysOfYear',
        daysOfYear: parseDaysOfYearInput(values.daysOfYear),
      }
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
    case 'certainDaysPerPeriod':
      return {
        kind: 'certainDaysPerPeriod',
        targetDays: values.targetDays,
        period: values.frequencyPeriod,
      }
    case 'flexiblePeriod':
      return { kind: 'flexiblePeriod' }
  }
}

export const buildHabitUpdateInput = (
  habitId: Habit['id'],
  values: HabitEditValues,
  selectedCategoryId: string,
): UpdateHabitInput => {
  const minimumConfigured = hasConfiguredMinimum(values)
  const goalConfig = buildHabitGoalConfig(values)

  return {
    id: habitId,
    title: values.title.trim(),
    description: values.description.trim() || null,
    notes: values.notes.trim() || null,
    categoryId: selectedCategoryId || null,
    priority: values.priority,
    trackingType: goalConfig.trackingType,
    goalConfig,
    scheduleRule: buildHabitSchedule(values),
    startsOn: values.startsOn,
    endsOn: values.endsOn || null,
    usesCompletionLevels: minimumConfigured,
    enabledCompletionLevels: minimumConfigured ? ['minimum', 'standard'] : ['standard'],
    defaultCompletionLevel: minimumConfigured ? 'standard' : null,
  }
}

export const getHabitCategoryOptions = (
  categories: readonly Category[],
  createdCategorySelection: Category | null,
) => {
  return createdCategorySelection &&
    !categories.some((category) => category.id === createdCategorySelection.id)
    ? [...categories, createdCategorySelection]
    : categories
}
