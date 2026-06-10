import type { ISODateString } from '@/shared/types'

import type { Habit, HabitLog } from '../types'
import { isHabitInactiveOnDate } from './habitInactivity'
import { isHabitScheduledOnDate } from './habitSchedule'

export type HabitAmountUnit = 'repetitions' | 'minutes' | 'quantity'

export type HabitAmountInputMetadata = {
  unit: HabitAmountUnit
  quantityUnitLabel: string | null
}

const isWithinHabitDateWindow = (habit: Habit, date: ISODateString) => {
  return date >= habit.startsOn && (!habit.endsOn || date <= habit.endsOn)
}

export const isHabitDayActionable = (input: {
  habit: Habit
  date: ISODateString
  today: ISODateString
}) => {
  const { habit, date, today } = input

  if (
    habit.lifecycleStatus !== 'active' ||
    date > today ||
    !isWithinHabitDateWindow(habit, date) ||
    isHabitInactiveOnDate(habit, date)
  ) {
    return false
  }

  return habit.scheduleRule.kind === 'flexiblePeriod' || isHabitScheduledOnDate(habit, date)
}

export const getHabitAmountInputMetadata = (habit: Habit): HabitAmountInputMetadata | null => {
  switch (habit.goalConfig.trackingType) {
    case 'repetitionsPerPeriod':
      return { unit: 'repetitions', quantityUnitLabel: null }
    case 'timePerSession':
    case 'totalTimePerPeriod':
      return { unit: 'minutes', quantityUnitLabel: null }
    case 'quantityPerSession':
    case 'totalQuantityPerPeriod':
      return { unit: 'quantity', quantityUnitLabel: habit.goalConfig.unitLabel }
    case 'binary':
    case 'timesPerPeriod':
      return null
  }
}

export const getHabitLogAmount = (habit: Habit, log?: HabitLog | null) => {
  if (!log || log.status !== 'completed') {
    return null
  }

  switch (habit.goalConfig.trackingType) {
    case 'repetitionsPerPeriod':
      return log.repetitions ?? null
    case 'timePerSession':
    case 'totalTimePerPeriod':
      return log.durationMinutes ?? null
    case 'quantityPerSession':
    case 'totalQuantityPerPeriod':
      return log.quantity ?? null
    case 'binary':
    case 'timesPerPeriod':
      return null
  }
}
