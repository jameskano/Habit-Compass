import { describe, expect, it } from 'vitest'

import { createHabit } from './logic/habitFixtures'
import { HabitCompletionLevelSchema, HabitGoalConfigSchema, HabitLogStatusSchema, HabitSchema } from './schemas'

describe('HabitGoalConfigSchema', () => {
  it('parses a binary goal', () => {
    expect(HabitGoalConfigSchema.parse({ trackingType: 'binary' }).trackingType).toBe('binary')
  })

  it('accepts optional binary minimum description', () => {
    const goal = HabitGoalConfigSchema.parse({
      trackingType: 'binary',
      minimumDescription: 'Read one page',
    })

    if (goal.trackingType !== 'binary') {
      throw new Error('Expected a binary goal')
    }

    expect(goal.minimumDescription).toBe('Read one page')
  })

  it('parses a frequency goal with a custom period', () => {
    const goal = HabitGoalConfigSchema.parse({
      trackingType: 'timesPerPeriod',
      targetCount: 3,
      period: 'custom',
      customPeriodDays: 10,
    })

    if (goal.trackingType !== 'timesPerPeriod') {
      throw new Error('Expected a timesPerPeriod goal')
    }

    expect(goal.customPeriodDays).toBe(10)
  })

  it('rejects zero and negative numeric minimum targets', () => {
    expect(
      HabitGoalConfigSchema.safeParse({
        trackingType: 'timePerSession',
        targetMinutes: 20,
        minimumMinutes: 0,
      }).success,
    ).toBe(false)
    expect(
      HabitGoalConfigSchema.safeParse({
        trackingType: 'quantityPerSession',
        targetQuantity: 20,
        minimumQuantity: -1,
        unitLabel: 'pages',
      }).success,
    ).toBe(false)
  })
})

describe('habit persisted state enums', () => {
  it('supports minimum and standard completion only', () => {
    expect(HabitCompletionLevelSchema.safeParse('minimum').success).toBe(true)
    expect(HabitCompletionLevelSchema.safeParse('standard').success).toBe(true)
    expect(HabitCompletionLevelSchema.safeParse('deep').success).toBe(false)
  })

  it('does not persist missed habit logs', () => {
    expect(HabitLogStatusSchema.safeParse('completed').success).toBe(true)
    expect(HabitLogStatusSchema.safeParse('skipped').success).toBe(true)
    expect(HabitLogStatusSchema.safeParse('missed').success).toBe(false)
  })
})

describe('HabitSchema schedules', () => {
  it('accepts persisted explicit and flexible schedules with priority and order', () => {
    expect(HabitSchema.safeParse(createHabit({ trackingType: 'binary' })).success).toBe(true)
    expect(
      HabitSchema.safeParse(
        createHabit({ trackingType: 'binary' }, { description: 'Clarifies the habit.', notes: 'Private note.' }),
      ).success,
    ).toBe(true)
    expect(
      HabitSchema.safeParse(createHabit({ trackingType: 'timesPerPeriod', period: 'week', targetCount: 3 }))
        .success,
    ).toBe(true)
    for (const scheduleRule of [
      { kind: 'specificDaysOfWeek', daysOfWeek: [1, 3] },
      { kind: 'everyXDays', intervalDays: 2 },
      { kind: 'everyXWeeks', intervalWeeks: 2, daysOfWeek: [1] },
      { kind: 'everyXMonths', intervalMonths: 1, dayOfMonth: 20 },
      { kind: 'firstWeekdayOfMonth', weekday: 1 },
    ] as const) {
      expect(HabitSchema.safeParse(createHabit({ trackingType: 'binary' }, { scheduleRule })).success).toBe(true)
    }
  })

  it('rejects ended-before-start and flexible non-period habits', () => {
    expect(
      HabitSchema.safeParse(
        createHabit({ trackingType: 'binary' }, { endsOn: '2025-12-31' }),
      ).success,
    ).toBe(false)
    expect(
      HabitSchema.safeParse(
        createHabit({ trackingType: 'binary' }, { scheduleRule: { kind: 'flexiblePeriod' } }),
      ).success,
    ).toBe(false)
  })

  it('rejects invalid completion-level configuration', () => {
    expect(
      HabitSchema.safeParse(
        createHabit({ trackingType: 'binary' }, { enabledCompletionLevels: ['minimum'] }),
      ).success,
    ).toBe(false)
    expect(
      HabitSchema.safeParse(
        createHabit(
          { trackingType: 'binary' },
          { enabledCompletionLevels: ['standard'], defaultCompletionLevel: 'minimum' },
        ),
      ).success,
    ).toBe(false)
  })

  it('validates inactivity periods while keeping paused as a future-compatible reason', () => {
    expect(
      HabitSchema.safeParse(
        createHabit(
          { trackingType: 'binary' },
          { inactivityPeriods: [{ reason: 'paused', startsOn: '2026-05-20', resumesOn: '2026-05-20' }] },
        ),
      ).success,
    ).toBe(true)
    expect(
      HabitSchema.safeParse(
        createHabit(
          { trackingType: 'binary' },
          { inactivityPeriods: [{ reason: 'archived', startsOn: '2026-05-20', resumesOn: '2026-05-19' }] },
        ),
      ).success,
    ).toBe(false)
    expect(
      HabitSchema.safeParse(
        createHabit(
          { trackingType: 'binary' },
          {
            inactivityPeriods: [
              { reason: 'archived', startsOn: '2026-05-19' },
              { reason: 'paused', startsOn: '2026-05-20' },
            ],
          },
        ),
      ).success,
    ).toBe(false)
  })
})
