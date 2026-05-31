import { describe, expect, it } from 'vitest'

import { createCompletionLevelHabit, createHabit, createHabitLog } from './habitFixtures'
import { calculateHabitDetailStats, createHabitCompletionBars } from './habitDetailStats'

describe('habit detail stats', () => {
  it('summarizes explicit-schedule completion counts and percentage', () => {
    const habit = createCompletionLevelHabit(
      { trackingType: 'binary' },
      ['minimum', 'standard'],
      { startsOn: '2026-05-18', scheduleRule: { kind: 'daily' } },
    )
    const result = calculateHabitDetailStats({
      habit,
      today: '2026-05-21',
      logs: [
        createHabitLog({ id: 'one', loggedForDate: '2026-05-18' }),
        createHabitLog({ id: 'two', loggedForDate: '2026-05-20', completionLevel: 'minimum' }),
      ],
    })

    expect(result.completionPercentage).toBe(50)
    expect(result.completionsThisWeek).toBe(2)
    expect(result.completionsThisMonth).toBe(2)
    expect(result.completionsThisYear).toBe(2)
    expect(result.totalCompletions).toBe(2)
  })

  it('uses the current flexible goal period instead of deriving empty-day failure', () => {
    const result = calculateHabitDetailStats({
      habit: createHabit(
        { trackingType: 'timesPerPeriod', period: 'week', targetCount: 3 },
        { startsOn: '2026-01-01' },
      ),
      today: '2026-05-21',
      logs: [
        createHabitLog({ id: 'current', loggedForDate: '2026-05-20' }),
        createHabitLog({ id: 'old', loggedForDate: '2026-04-03' }),
      ],
    })

    expect(result.completionPercentage).toBe(0)
    expect(result.totalCompletions).toBe(2)
    expect(result.currentStreak).toBeNull()
  })

  it('groups completion events into chart bars without storing derived state', () => {
    const habit = createHabit({ trackingType: 'binary' }, { startsOn: '2024-03-01' })
    const logs = [
      createHabitLog({ id: 'one', loggedForDate: '2026-05-18' }),
      createHabitLog({ id: 'two', loggedForDate: '2026-05-18' }),
      createHabitLog({ id: 'three', loggedForDate: '2026-05-21', status: 'skipped' }),
    ]

    const weeklyBars = createHabitCompletionBars({
      habit,
      logs,
      period: 'week',
      today: '2026-05-21',
      startsOn: '2024-03-01',
    })
    const monthlyBars = createHabitCompletionBars({
      habit,
      logs,
      period: 'month',
      today: '2026-05-21',
      startsOn: '2024-03-01',
    })
    const yearlyBars = createHabitCompletionBars({
      habit,
      logs,
      period: 'year',
      today: '2026-05-21',
      startsOn: '2024-03-01',
    })

    expect(weeklyBars[0].completionEvents).toBe(2)
    expect(monthlyBars).toHaveLength(12)
    expect(monthlyBars[4].completionEvents).toBe(2)
    expect(yearlyBars).toHaveLength(3)
    expect(yearlyBars[0].completionEvents).toBe(0)
    expect(yearlyBars[2].completionEvents).toBe(2)
  })

  it('excludes completion logs recorded while inactive from tiles and chart bars', () => {
    const habit = createHabit(
      { trackingType: 'binary' },
      {
        startsOn: '2026-05-18',
        inactivityPeriods: [
          { reason: 'archived', startsOn: '2026-05-19', resumesOn: '2026-05-21' },
        ],
      },
    )
    const logs = [
      createHabitLog({ id: 'active', loggedForDate: '2026-05-18' }),
      createHabitLog({ id: 'inactive', loggedForDate: '2026-05-20' }),
    ]

    expect(calculateHabitDetailStats({ habit, logs, today: '2026-05-21' }).totalCompletions).toBe(1)
    expect(
      createHabitCompletionBars({
        habit,
        logs,
        period: 'week',
        today: '2026-05-21',
        startsOn: habit.startsOn,
      }).reduce((total, bar) => total + bar.completionEvents, 0),
    ).toBe(1)
  })
})
