import type { Habit, HabitCompletionLevel, HabitGoalConfig, HabitLog, HabitResetMode } from '../types'

type HabitFixtureOverrides = Partial<Habit>
type HabitLogFixtureOverrides = Partial<HabitLog>

const baseTimestamp = '2026-05-21T08:00:00.000Z'

export function createHabit(goalConfig: HabitGoalConfig, overrides: HabitFixtureOverrides = {}): Habit {
  return {
    id: 'habit-1',
    userId: 'user-1',
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
    archivedAt: null,
    title: 'Habit fixture',
    notes: null,
    lifecycleStatus: 'active',
    categoryId: null,
    priority: 'medium',
    startsOn: '2026-01-01',
    endsOn: null,
    order: 0,
    scheduleRule:
      'period' in goalConfig
        ? { kind: 'flexiblePeriod' }
        : { kind: 'daily' },
    trackingType: goalConfig.trackingType,
    goalConfig,
    usesCompletionLevels: false,
    enabledCompletionLevels: [],
    defaultCompletionLevel: null,
    resetMode: 'soft',
    ...overrides,
  }
}

export function createCompletionLevelHabit(
  goalConfig: HabitGoalConfig,
  enabledCompletionLevels: HabitCompletionLevel[],
  overrides: HabitFixtureOverrides = {},
) {
  const defaultCompletionLevel = enabledCompletionLevels.includes('standard')
    ? 'standard'
    : enabledCompletionLevels[0] ?? null

  return createHabit(goalConfig, {
    usesCompletionLevels: true,
    enabledCompletionLevels,
    defaultCompletionLevel,
    ...overrides,
  })
}

export function createHabitLog(overrides: HabitLogFixtureOverrides = {}): HabitLog {
  return {
    id: `habit-log-${overrides.loggedForDate ?? '2026-05-21'}`,
    userId: 'user-1',
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
    archivedAt: null,
    habitId: 'habit-1',
    loggedForDate: '2026-05-21',
    loggedAt: '2026-05-21T08:00:00.000Z',
    status: 'completed',
    completionLevel: null,
    repetitions: null,
    durationMinutes: null,
    quantity: null,
    quantityUnitLabel: null,
    notes: null,
    ...overrides,
  }
}

export function createResettableHabit(resetMode: HabitResetMode = 'soft') {
  return createHabit({ trackingType: 'binary' }, { resetMode })
}

export const habitSchedules = {
  daily: { kind: 'daily' } as const,
  mondayWednesdayFriday: { kind: 'specificDaysOfWeek', daysOfWeek: [1, 3, 5] } as const,
}
