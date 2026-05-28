import { describe, expect, it } from 'vitest'

import { createCompletionLevelHabit, createHabitLog } from './habitFixtures'
import { calculateHabitStats } from './habitStats'

describe('calculateHabitStats', () => {
  it('scores explicit schedules, excludes skipped days, and calculates streaks', () => {
    const habit = createCompletionLevelHabit(
      { trackingType: 'binary' },
      ['minimum', 'standard'],
      { startsOn: '2026-05-18', scheduleRule: { kind: 'daily' } },
    )
    const result = calculateHabitStats({
      habit,
      logs: [
        createHabitLog({ id: 'one', loggedForDate: '2026-05-18', completionLevel: 'standard' }),
        createHabitLog({ id: 'two', loggedForDate: '2026-05-19', status: 'skipped' }),
        createHabitLog({ id: 'three', loggedForDate: '2026-05-20', completionLevel: 'minimum' }),
        createHabitLog({ id: 'outside', loggedForDate: '2026-05-17' }),
      ],
      from: '2026-05-18',
      to: '2026-05-21',
      today: '2026-05-21',
    })

    expect(result.completionEvents).toBe(2)
    expect(result.completionScore).toBe(1.5)
    expect(result.expectedScore).toBe(2)
    expect(result.completionPercentage).toBe(75)
    expect(result.currentStreak).toBe(2)
    expect(result.bestStreak).toBe(2)
  })

  it('reports flexible period progress without per-day streaks', () => {
    const result = calculateHabitStats({
      habit: createCompletionLevelHabit(
        { trackingType: 'timesPerPeriod', period: 'week', targetCount: 3, minimumCount: 1 },
        ['minimum', 'standard'],
      ),
      logs: [
        createHabitLog({ id: 'one', loggedForDate: '2026-05-18' }),
        createHabitLog({ id: 'two', loggedForDate: '2026-05-20', completionLevel: 'minimum' }),
      ],
      from: '2026-05-18',
      to: '2026-05-24',
      today: '2026-05-21',
    })

    expect(result.completionScore).toBe(0.5)
    expect(result.completionPercentage).toBe(50)
    expect(result.currentStreak).toBeNull()
  })

  it('does not score below-minimum session progress as valid completion', () => {
    const habit = createCompletionLevelHabit(
      { trackingType: 'timePerSession', targetMinutes: 30, minimumMinutes: 10 },
      ['minimum', 'standard'],
      { startsOn: '2026-05-18', scheduleRule: { kind: 'daily' } },
    )

    const result = calculateHabitStats({
      habit,
      logs: [
        createHabitLog({ id: 'below', loggedForDate: '2026-05-18', durationMinutes: 5 }),
        createHabitLog({ id: 'minimum', loggedForDate: '2026-05-19', durationMinutes: 10 }),
        createHabitLog({ id: 'standard', loggedForDate: '2026-05-20', durationMinutes: 30 }),
        createHabitLog({ id: 'skipped', loggedForDate: '2026-05-21', status: 'skipped' }),
      ],
      from: '2026-05-18',
      to: '2026-05-22',
      today: '2026-05-22',
    })

    expect(result.completionEvents).toBe(2)
    expect(result.completionScore).toBe(1.5)
    expect(result.expectedScore).toBe(3)
    expect(result.completionPercentage).toBe(50)
  })

  it('scores period quantity/time targets once per period', () => {
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
    const wednesday = createHabitLog({ id: 'wednesday', loggedForDate: '2026-05-20', repetitions: 20 })
    const friday = createHabitLog({ id: 'friday', loggedForDate: '2026-05-22', repetitions: 50 })

    expect(
      calculateHabitStats({
        habit,
        logs: [monday],
        from: '2026-05-18',
        to: '2026-05-24',
        today: '2026-05-22',
      }).completionScore,
    ).toBe(0)
    expect(
      calculateHabitStats({
        habit,
        logs: [monday, wednesday],
        from: '2026-05-18',
        to: '2026-05-24',
        today: '2026-05-22',
      }).completionScore,
    ).toBe(0.5)
    expect(
      calculateHabitStats({
        habit,
        logs: [monday, wednesday, friday],
        from: '2026-05-18',
        to: '2026-05-24',
        today: '2026-05-22',
      }).completionScore,
    ).toBe(1)
  })
})
