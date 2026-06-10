import type { ISODateTimeString } from '@/shared/types'

import type { Habit, HabitLog } from '../types'

export type HabitResetResult = {
  habit: Habit
  logs: HabitLog[]
  mode: 'soft' | 'hard'
  historyPreserved: boolean
}

export const resetHabitStats = (
  habit: Habit,
  logs: HabitLog[],
  resetAt: ISODateTimeString,
): HabitResetResult => {
  return {
    habit: {
      ...habit,
      updatedAt: resetAt,
      resetMode: 'soft',
    },
    logs,
    mode: 'soft',
    historyPreserved: true,
  }
}

export const hardResetHabitStats = (
  habit: Habit,
  _logs: HabitLog[],
  resetAt: ISODateTimeString,
  confirmHardReset: boolean,
): HabitResetResult => {
  if (!confirmHardReset) {
    throw new Error('Hard reset requires explicit confirmation.')
  }

  return {
    habit: {
      ...habit,
      updatedAt: resetAt,
      resetMode: 'hard',
    },
    logs: [],
    mode: 'hard',
    historyPreserved: false,
  }
}

export const archiveHabit = (habit: Habit, logs: HabitLog[], archivedAt: ISODateTimeString) => {
  const startsOn = archivedAt.slice(0, 10) as Habit['startsOn']
  return {
    habit: {
      ...habit,
      lifecycleStatus: 'archived' as const,
      archivedAt,
      updatedAt: archivedAt,
      inactivityPeriods: [...habit.inactivityPeriods, { reason: 'archived' as const, startsOn }],
    },
    logs,
  }
}
