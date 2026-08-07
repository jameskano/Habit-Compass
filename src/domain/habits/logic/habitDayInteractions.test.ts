import { describe, expect, it } from 'vitest'

import { createHabit, createHabitLog, habitSchedules } from './habitFixtures'
import {
  getHabitAmountInputMetadata,
  getHabitLogAmount,
  isHabitDayActionable,
} from './habitDayInteractions'

describe('habit day interactions', () => {
  it('disables future, explicitly unscheduled, inactive, and archived days', () => {
    expect(
      isHabitDayActionable({
        habit: createHabit({ trackingType: 'binary' }),
        date: '2026-05-22',
        today: '2026-05-21',
      }),
    ).toBe(false)
    expect(
      isHabitDayActionable({
        habit: createHabit(
          { trackingType: 'binary' },
          { scheduleRule: habitSchedules.mondayWednesdayFriday },
        ),
        date: '2026-05-19',
        today: '2026-05-21',
      }),
    ).toBe(false)
    expect(
      isHabitDayActionable({
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
      }),
    ).toBe(false)
    expect(
      isHabitDayActionable({
        habit: createHabit({ trackingType: 'binary' }, { lifecycleStatus: 'archived' }),
        date: '2026-05-21',
        today: '2026-05-21',
      }),
    ).toBe(false)
  })

  it('keeps active flexible-period dates actionable', () => {
    expect(
      isHabitDayActionable({
        habit: createHabit({
          trackingType: 'totalMeasurablePerPeriod',
          period: 'week',
          targetAmount: 100,
          unitLabel: 'repetitions',
        }),
        date: '2026-05-21',
        today: '2026-05-21',
      }),
    ).toBe(true)
  })

  it('maps numeric goal inputs and existing raw values', () => {
    const repetitionsHabit = createHabit({
      trackingType: 'totalMeasurablePerPeriod',
      period: 'week',
      targetAmount: 100,
      unitLabel: 'repetitions',
    })
    const timeHabit = createHabit({
      trackingType: 'measurablePerSession',
      targetAmount: 20,
      unitLabel: 'minutes',
    })
    const quantityHabit = createHabit({
      trackingType: 'measurablePerSession',
      targetAmount: 10,
      unitLabel: 'pages',
    })

    expect(getHabitAmountInputMetadata(repetitionsHabit)).toEqual({
      unitLabel: 'repetitions',
    })
    expect(getHabitAmountInputMetadata(timeHabit)).toEqual({
      unitLabel: 'minutes',
    })
    expect(getHabitAmountInputMetadata(quantityHabit)).toEqual({
      unitLabel: 'pages',
    })
    expect(getHabitLogAmount(repetitionsHabit, createHabitLog({ amount: 140 }))).toBe(140)
    expect(getHabitLogAmount(timeHabit, createHabitLog({ amount: 45 }))).toBe(45)
    expect(getHabitLogAmount(quantityHabit, createHabitLog({ amount: 18 }))).toBe(18)
  })
})
