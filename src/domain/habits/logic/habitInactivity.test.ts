import { describe, expect, it } from 'vitest'

import { createHabit, createHabitLog } from './habitFixtures'
import {
  doesHabitInactivityOverlapRange,
  filterEligibleHabitLogs,
  isHabitInactiveOnDate,
} from './habitInactivity'

describe('habit inactivity', () => {
  it('supports multiple archive cycles and treats same-day restore as an empty interval', () => {
    const habit = createHabit(
      { trackingType: 'binary' },
      {
        inactivityPeriods: [
          { reason: 'archived', startsOn: '2026-05-10', resumesOn: '2026-05-12' },
          { reason: 'archived', startsOn: '2026-05-15', resumesOn: '2026-05-15' },
          { reason: 'paused', startsOn: '2026-05-20', resumesOn: null },
        ],
      },
    )

    expect(isHabitInactiveOnDate(habit, '2026-05-10')).toBe(true)
    expect(isHabitInactiveOnDate(habit, '2026-05-12')).toBe(false)
    expect(isHabitInactiveOnDate(habit, '2026-05-15')).toBe(false)
    expect(isHabitInactiveOnDate(habit, '2026-05-21')).toBe(true)
  })

  it('filters malformed logs recorded inside inactive intervals and detects period overlap', () => {
    const habit = createHabit(
      { trackingType: 'binary' },
      {
        inactivityPeriods: [
          { reason: 'archived', startsOn: '2026-05-19', resumesOn: '2026-05-21' },
        ],
      },
    )
    const logs = [
      createHabitLog({ id: 'active', loggedForDate: '2026-05-18' }),
      createHabitLog({ id: 'inactive', loggedForDate: '2026-05-20' }),
    ]

    expect(filterEligibleHabitLogs(habit, logs).map((log) => log.id)).toEqual(['active'])
    expect(doesHabitInactivityOverlapRange(habit, '2026-05-18', '2026-05-24')).toBe(true)
    expect(doesHabitInactivityOverlapRange(habit, '2026-05-21', '2026-05-24')).toBe(false)
  })
})
