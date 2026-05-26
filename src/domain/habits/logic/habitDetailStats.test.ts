import { describe, expect, it } from 'vitest'

import { createHabit, createHabitLog } from './habitFixtures'
import { calculateHabitDetailStats, createHabitCompletionBars } from './habitDetailStats'

describe('habit detail stats', () => {
  it('summarizes explicit-schedule completion counts and percentage', () => {
    const habit = createHabit(
      { trackingType: 'binary' },
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

    expect(result.completionPercentage).toBe(33)
    expect(result.totalCompletions).toBe(2)
    expect(result.currentStreak).toBeNull()
  })

  it('groups completion events into chart bars without storing derived state', () => {
    const logs = [
      createHabitLog({ id: 'one', loggedForDate: '2026-05-18' }),
      createHabitLog({ id: 'two', loggedForDate: '2026-05-18' }),
      createHabitLog({ id: 'three', loggedForDate: '2026-05-21', status: 'skipped' }),
    ]

    const weeklyBars = createHabitCompletionBars({ logs, period: 'week', today: '2026-05-21' })
    const monthlyBars = createHabitCompletionBars({ logs, period: 'month', today: '2026-05-21' })
    const yearlyBars = createHabitCompletionBars({ logs, period: 'year', today: '2026-05-21' })

    expect(weeklyBars[0].completionEvents).toBe(2)
    expect(monthlyBars).toHaveLength(5)
    expect(monthlyBars.reduce((total, bar) => total + bar.completionEvents, 0)).toBe(2)
    expect(yearlyBars).toHaveLength(12)
    expect(yearlyBars[4].completionEvents).toBe(2)
  })
})
