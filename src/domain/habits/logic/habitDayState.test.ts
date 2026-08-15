import { describe, expect, it } from 'vitest'

import {
  createCompletionLevelHabit,
  createHabit,
  createHabitLog,
  habitSchedules,
} from './habitFixtures'
import { deriveHabitDayState } from './habitDayState'

describe('deriveHabitDayState', () => {
  it('derives completed levels and skips from persisted logs', () => {
    expect(
      deriveHabitDayState({
        habit: createCompletionLevelHabit({ trackingType: 'binary' }, ['minimum', 'standard']),
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

  it('treats unsupported minimum binary logs as standard completion', () => {
    expect(
      deriveHabitDayState({
        habit: createHabit({ trackingType: 'binary' }),
        date: '2026-05-21',
        today: '2026-05-21',
        logs: [createHabitLog({ completionLevel: 'minimum' })],
      }),
    ).toBe('completed_standard')
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

  it('shows inactive dates neutrally even if malformed logs exist for them', () => {
    expect(
      deriveHabitDayState({
        habit: createHabit(
          { trackingType: 'binary' },
          {
            inactivityPeriods: [
              { reason: 'archived', startsOn: '2026-05-20', resumesOn: '2026-05-21' },
            ],
          },
        ),
        date: '2026-05-20',
        today: '2026-05-21',
        logs: [createHabitLog({ loggedForDate: '2026-05-20' })],
      }),
    ).toBe('inactive')
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

  it('shows recorded flexible-period completions without deriving missed empty dates', () => {
    const flexibleHabit = createCompletionLevelHabit(
      { trackingType: 'binary', minimumDescription: 'Do the minimum' },
      ['minimum', 'standard'],
      { scheduleRule: { kind: 'certainDaysPerPeriod', period: 'week', targetDays: 3 } },
    )

    expect(
      deriveHabitDayState({
        habit: flexibleHabit,
        date: '2026-05-21',
        today: '2026-05-21',
        logs: [createHabitLog({ completionLevel: 'minimum' })],
      }),
    ).toBe('completed_minimum')
    expect(
      deriveHabitDayState({
        habit: flexibleHabit,
        date: '2026-05-20',
        today: '2026-05-21',
        logs: [],
      }),
    ).toBe('not_scheduled')
  })

  it('derives session measurable progress from logged values', () => {
    const habitWithMinimum = createCompletionLevelHabit(
      {
        trackingType: 'measurablePerSession',
        targetAmount: 30,
        minimumAmount: 10,
        unitLabel: 'minutes',
      },
      ['minimum', 'standard'],
    )
    const standardOnlyHabit = createHabit({
      trackingType: 'measurablePerSession',
      targetAmount: 30,
      unitLabel: 'minutes',
    })

    expect(
      deriveHabitDayState({
        habit: habitWithMinimum,
        date: '2026-05-21',
        today: '2026-05-21',
        logs: [createHabitLog({ amount: 5 })],
      }),
    ).toBe('progress_logged')
    expect(
      deriveHabitDayState({
        habit: habitWithMinimum,
        date: '2026-05-21',
        today: '2026-05-21',
        logs: [createHabitLog({ amount: 10 })],
      }),
    ).toBe('completed_minimum')
    expect(
      deriveHabitDayState({
        habit: standardOnlyHabit,
        date: '2026-05-21',
        today: '2026-05-21',
        logs: [createHabitLog({ amount: 10 })],
      }),
    ).toBe('progress_logged')
    expect(
      deriveHabitDayState({
        habit: standardOnlyHabit,
        date: '2026-05-21',
        today: '2026-05-21',
        logs: [createHabitLog({ amount: 30 })],
      }),
    ).toBe('completed_standard')
  })

  it('colors only logged days for period measurable targets based on the period total', () => {
    const habit = createCompletionLevelHabit(
      {
        trackingType: 'totalMeasurablePerPeriod',
        period: 'week',
        targetAmount: 100,
        minimumAmount: 50,
        unitLabel: 'repetitions',
      },
      ['minimum', 'standard'],
      { startsOn: '2026-05-18' },
    )
    const monday = createHabitLog({ id: 'monday', loggedForDate: '2026-05-18', amount: 30 })
    const wednesday = createHabitLog({
      id: 'wednesday',
      loggedForDate: '2026-05-20',
      amount: 20,
    })
    const friday = createHabitLog({ id: 'friday', loggedForDate: '2026-05-22', amount: 50 })

    expect(
      deriveHabitDayState({ habit, date: '2026-05-18', today: '2026-05-22', logs: [monday] }),
    ).toBe('progress_logged')
    expect(
      deriveHabitDayState({
        habit,
        date: '2026-05-18',
        today: '2026-05-22',
        logs: [monday, wednesday],
      }),
    ).toBe('completed_minimum')
    expect(
      deriveHabitDayState({
        habit,
        date: '2026-05-20',
        today: '2026-05-22',
        logs: [monday, wednesday],
      }),
    ).toBe('completed_minimum')
    expect(
      deriveHabitDayState({
        habit,
        date: '2026-05-22',
        today: '2026-05-22',
        logs: [monday, wednesday, friday],
      }),
    ).toBe('completed_standard')
    expect(
      deriveHabitDayState({
        habit,
        date: '2026-05-19',
        today: '2026-05-22',
        logs: [monday, wednesday, friday],
      }),
    ).toBe('not_scheduled')
  })

  it('never derives minimum for period measurable targets without a configured minimum', () => {
    const habit = createHabit(
      {
        trackingType: 'totalMeasurablePerPeriod',
        period: 'week',
        targetAmount: 100,
        unitLabel: 'repetitions',
      },
      { startsOn: '2026-05-18' },
    )
    const monday = createHabitLog({ id: 'monday', loggedForDate: '2026-05-18', amount: 30 })
    const friday = createHabitLog({ id: 'friday', loggedForDate: '2026-05-22', amount: 70 })

    expect(
      deriveHabitDayState({ habit, date: '2026-05-18', today: '2026-05-22', logs: [monday] }),
    ).toBe('progress_logged')
    expect(
      deriveHabitDayState({
        habit,
        date: '2026-05-18',
        today: '2026-05-22',
        logs: [monday, friday],
      }),
    ).toBe('completed_standard')
  })
})
