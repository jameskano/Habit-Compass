import { describe, expect, it } from 'vitest'

import { createCompletionLevelHabit, createHabit, createHabitLog } from './habitFixtures'
import { getCertainDaysPeriodState } from './habitCertainDays'

describe('getCertainDaysPeriodState', () => {
  it('counts at most one qualifying completion per date', () => {
    const habit = createHabit(
      { trackingType: 'binary' },
      { scheduleRule: { kind: 'certainDaysPerPeriod', targetDays: 3, period: 'week' } },
    )

    const state = getCertainDaysPeriodState({
      habit,
      date: '2026-05-20',
      logs: [
        createHabitLog({ id: 'one', loggedForDate: '2026-05-18' }),
        createHabitLog({ id: 'duplicate', loggedForDate: '2026-05-18' }),
        createHabitLog({ id: 'two', loggedForDate: '2026-05-20' }),
      ],
    })

    expect(state?.qualifyingDates).toEqual(['2026-05-18', '2026-05-20'])
    expect(state?.isTargetReached).toBe(false)
  })

  it('qualifies measurable minimum and standard days but not below-minimum or skipped logs', () => {
    const habit = createCompletionLevelHabit(
      {
        trackingType: 'measurablePerSession',
        targetAmount: 30,
        minimumAmount: 10,
        unitLabel: 'minutes',
      },
      ['minimum', 'standard'],
      { scheduleRule: { kind: 'certainDaysPerPeriod', targetDays: 2, period: 'week' } },
    )

    const state = getCertainDaysPeriodState({
      habit,
      date: '2026-05-21',
      logs: [
        createHabitLog({ id: 'below', loggedForDate: '2026-05-18', amount: 5 }),
        createHabitLog({ id: 'minimum', loggedForDate: '2026-05-19', amount: 10 }),
        createHabitLog({ id: 'standard', loggedForDate: '2026-05-20', amount: 30 }),
        createHabitLog({
          id: 'skipped',
          loggedForDate: '2026-05-21',
          amount: 30,
          status: 'skipped',
        }),
      ],
    })

    expect(state?.qualifyingDates).toEqual(['2026-05-19', '2026-05-20'])
    expect(state?.isTargetReached).toBe(true)
  })

  it('uses week preference boundaries and caps the target to active lifecycle dates', () => {
    const habit = createHabit(
      { trackingType: 'binary' },
      {
        startsOn: '2026-12-30',
        endsOn: '2027-01-02',
        scheduleRule: { kind: 'certainDaysPerPeriod', targetDays: 7, period: 'week' },
      },
    )

    const monday = getCertainDaysPeriodState({
      habit,
      logs: [],
      date: '2027-01-01',
      weekStartsOn: 1,
    })
    const sunday = getCertainDaysPeriodState({
      habit,
      logs: [],
      date: '2027-01-01',
      weekStartsOn: 0,
    })

    expect(monday).toMatchObject({
      periodStart: '2026-12-28',
      periodEnd: '2027-01-03',
      effectiveTargetDays: 4,
    })
    expect(sunday).toMatchObject({
      periodStart: '2026-12-27',
      periodEnd: '2027-01-02',
      effectiveTargetDays: 4,
    })
  })
})
