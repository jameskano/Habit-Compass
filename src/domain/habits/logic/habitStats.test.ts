import { describe, expect, it } from 'vitest'

import { createHabit, createHabitLog } from './habitFixtures'
import { calculateHabitStats } from './habitStats'

describe('calculateHabitStats', () => {
  it('scores explicit schedules, excludes skipped days, and calculates streaks', () => {
    const habit = createHabit(
      { trackingType: 'binary' },
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
      habit: createHabit({ trackingType: 'timesPerPeriod', period: 'week', targetCount: 3 }),
      logs: [
        createHabitLog({ id: 'one', loggedForDate: '2026-05-18' }),
        createHabitLog({ id: 'two', loggedForDate: '2026-05-20', completionLevel: 'minimum' }),
      ],
      from: '2026-05-18',
      to: '2026-05-24',
      today: '2026-05-21',
    })

    expect(result.completionScore).toBe(1.5)
    expect(result.completionPercentage).toBe(50)
    expect(result.currentStreak).toBeNull()
  })
})
