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
      {
        trackingType: 'timesPerPeriod',
        period: 'week',
        targetCount: 3,
        minimumCount: 1,
      },
      ['minimum', 'standard'],
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

  it('derives session quantity/time progress from logged values', () => {
    const habitWithMinimum = createCompletionLevelHabit(
      { trackingType: 'timePerSession', targetMinutes: 30, minimumMinutes: 10 },
      ['minimum', 'standard'],
    )
    const standardOnlyHabit = createHabit({ trackingType: 'timePerSession', targetMinutes: 30 })

    expect(
      deriveHabitDayState({
        habit: habitWithMinimum,
        date: '2026-05-21',
        today: '2026-05-21',
        logs: [createHabitLog({ durationMinutes: 5 })],
      }),
    ).toBe('progress_logged')
    expect(
      deriveHabitDayState({
        habit: habitWithMinimum,
        date: '2026-05-21',
        today: '2026-05-21',
        logs: [createHabitLog({ durationMinutes: 10 })],
      }),
    ).toBe('completed_minimum')
    expect(
      deriveHabitDayState({
        habit: standardOnlyHabit,
        date: '2026-05-21',
        today: '2026-05-21',
        logs: [createHabitLog({ durationMinutes: 10 })],
      }),
    ).toBe('progress_logged')
    expect(
      deriveHabitDayState({
        habit: standardOnlyHabit,
        date: '2026-05-21',
        today: '2026-05-21',
        logs: [createHabitLog({ durationMinutes: 30 })],
      }),
    ).toBe('completed_standard')
  })

  it('colors only logged days for period quantity/time targets based on the period total', () => {
    const habit = createCompletionLevelHabit(
      {
        trackingType: 'repetitionsPerPeriod',
        period: 'week',
        targetRepetitions: 100,
        minimumRepetitions: 50,
      },
      ['minimum', 'standard'],
      { startsOn: '2026-05-18' },
    )
    const monday = createHabitLog({ id: 'monday', loggedForDate: '2026-05-18', repetitions: 30 })
    const wednesday = createHabitLog({
      id: 'wednesday',
      loggedForDate: '2026-05-20',
      repetitions: 20,
    })
    const friday = createHabitLog({ id: 'friday', loggedForDate: '2026-05-22', repetitions: 50 })

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

  it('never derives minimum for period quantity/time targets without a configured minimum', () => {
    const habit = createHabit(
      {
        trackingType: 'repetitionsPerPeriod',
        period: 'week',
        targetRepetitions: 100,
      },
      { startsOn: '2026-05-18' },
    )
    const monday = createHabitLog({ id: 'monday', loggedForDate: '2026-05-18', repetitions: 30 })
    const friday = createHabitLog({ id: 'friday', loggedForDate: '2026-05-22', repetitions: 70 })

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
