import { describe, expect, it } from 'vitest'

import { createHabit, createHabitLog, habitSchedules } from './habitFixtures'
import { deriveHabitDayState } from './habitDayState'

describe('deriveHabitDayState', () => {
  it('derives completed levels and skips from persisted logs', () => {
    expect(
      deriveHabitDayState({
        habit: createHabit({ trackingType: 'binary' }),
        date: '2026-05-21',
        today: '2026-05-21',
        logs: [createHabitLog({ completionLevel: 'minimum' })],
      }),
    ).toBe('completed_minimum')
    expect(
      deriveHabitDayState({
        habit: createHabit({ trackingType: 'binary' }),
        date: '2026-05-21',
        today: '2026-05-21',
        logs: [createHabitLog({ status: 'skipped' })],
      }),
    ).toBe('skipped')
  })

  it('derives missing scheduled history without storing missed logs', () => {
    expect(
      deriveHabitDayState({
        habit: createHabit({ trackingType: 'binary' }),
        date: '2026-05-20',
        today: '2026-05-21',
        logs: [],
      }),
    ).toBe('missed')
  })

  it('distinguishes pending, unscheduled, and future dates', () => {
    expect(
      deriveHabitDayState({
        habit: createHabit({ trackingType: 'binary' }),
        date: '2026-05-21',
        today: '2026-05-21',
        logs: [],
      }),
    ).toBe('today_pending')
    expect(
      deriveHabitDayState({
        habit: createHabit(
          { trackingType: 'binary' },
          { scheduleRule: habitSchedules.mondayWednesdayFriday },
        ),
        date: '2026-05-19',
        today: '2026-05-21',
        logs: [],
      }),
    ).toBe('not_scheduled')
    expect(
      deriveHabitDayState({
        habit: createHabit({ trackingType: 'binary' }),
        date: '2026-05-22',
        today: '2026-05-21',
        logs: [],
      }),
    ).toBe('future')
  })
})
