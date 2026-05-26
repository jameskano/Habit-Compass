import { describe, expect, it } from 'vitest'

import { createHabit } from './habitFixtures'
import { enumerateHabitScheduledDates, isHabitScheduledOnDate } from './habitSchedule'

describe('habit scheduling', () => {
  it('supports daily, selected weekday, interval, weekly, and monthly rules', () => {
    expect(isHabitScheduledOnDate(createHabit({ trackingType: 'binary' }), '2026-05-18')).toBe(true)
    expect(
      isHabitScheduledOnDate(
        createHabit(
          { trackingType: 'binary' },
          { scheduleRule: { kind: 'specificDaysOfWeek', daysOfWeek: [1] } },
        ),
        '2026-05-18',
      ),
    ).toBe(true)
    expect(
      isHabitScheduledOnDate(
        createHabit(
          { trackingType: 'binary' },
          {
            startsOn: '2026-05-11',
            scheduleRule: { kind: 'everyXWeeks', intervalWeeks: 1, daysOfWeek: [1] },
          },
        ),
        '2026-05-18',
      ),
    ).toBe(true)
    expect(
      isHabitScheduledOnDate(
        createHabit(
          { trackingType: 'binary' },
          { startsOn: '2026-05-18', scheduleRule: { kind: 'everyXDays', intervalDays: 2 } },
        ),
        '2026-05-20',
      ),
    ).toBe(true)
    expect(
      isHabitScheduledOnDate(
        createHabit(
          { trackingType: 'binary' },
          { scheduleRule: { kind: 'firstWeekdayOfMonth', weekday: 1 } },
        ),
        '2026-06-01',
      ),
    ).toBe(true)
    expect(
      isHabitScheduledOnDate(
        createHabit(
          { trackingType: 'binary' },
          { startsOn: '2026-05-01', scheduleRule: { kind: 'everyXMonths', intervalMonths: 1, dayOfMonth: 21 } },
        ),
        '2026-05-21',
      ),
    ).toBe(true)
  })

  it('honors end dates and does not enumerate flexible periods', () => {
    const ended = createHabit(
      { trackingType: 'binary' },
      { startsOn: '2026-05-18', endsOn: '2026-05-19', scheduleRule: { kind: 'daily' } },
    )
    expect(enumerateHabitScheduledDates(ended, '2026-05-18', '2026-05-21')).toEqual([
      '2026-05-18',
      '2026-05-19',
    ])
    expect(
      enumerateHabitScheduledDates(
        createHabit({ trackingType: 'timesPerPeriod', period: 'week', targetCount: 3 }),
        '2026-05-18',
        '2026-05-21',
      ),
    ).toEqual([])
  })
})
