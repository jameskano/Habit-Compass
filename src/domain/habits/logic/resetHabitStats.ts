import type { ISODateTimeString } from '@/shared/types'

import type { Habit, HabitLog } from '../types'

export type HabitResetResult = {
  habit: Habit
  logs: HabitLog[]
  mode: 'soft' | 'hard'
  historyPreserved: boolean
}

export type HabitDeleteResult = {
  habit: Habit
  logs: HabitLog[]
  shouldPurgeHistory: boolean
}

export function resetHabitStats(habit: Habit, logs: HabitLog[], resetAt: ISODateTimeString): HabitResetResult {
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

export function hardResetHabitStats(
  habit: Habit,
  _logs: HabitLog[],
  resetAt: ISODateTimeString,
  confirmHardReset: boolean,
): HabitResetResult {
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

export function archiveHabit(habit: Habit, logs: HabitLog[], archivedAt: ISODateTimeString) {
  return {
    habit: {
      ...habit,
      lifecycleStatus: 'archived' as const,
      archivedAt,
      updatedAt: archivedAt,
    },
    logs,
  }
}

export function deleteHabit(habit: Habit, logs: HabitLog[], deletedAt: ISODateTimeString, prepareHardDelete = false): HabitDeleteResult {
  return {
    habit: {
      ...habit,
      lifecycleStatus: 'deleted' as const,
      deletedAt,
      updatedAt: deletedAt,
    },
    logs,
    shouldPurgeHistory: prepareHardDelete,
  }
}
