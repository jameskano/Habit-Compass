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
          trackingType: 'repetitionsPerPeriod',
          period: 'week',
          targetRepetitions: 100,
        }),
        date: '2026-05-21',
        today: '2026-05-21',
      }),
    ).toBe(true)
  })

  it('maps numeric goal inputs and existing raw values', () => {
    const repetitionsHabit = createHabit({
      trackingType: 'repetitionsPerPeriod',
      period: 'week',
      targetRepetitions: 100,
    })
    const timeHabit = createHabit({ trackingType: 'timePerSession', targetMinutes: 20 })
    const quantityHabit = createHabit({
      trackingType: 'quantityPerSession',
      targetQuantity: 10,
      unitLabel: 'pages',
    })

    expect(getHabitAmountInputMetadata(repetitionsHabit)).toEqual({
      unit: 'repetitions',
      quantityUnitLabel: null,
    })
    expect(getHabitAmountInputMetadata(timeHabit)).toEqual({
      unit: 'minutes',
      quantityUnitLabel: null,
    })
    expect(getHabitAmountInputMetadata(quantityHabit)).toEqual({
      unit: 'quantity',
      quantityUnitLabel: 'pages',
    })
    expect(getHabitLogAmount(repetitionsHabit, createHabitLog({ repetitions: 140 }))).toBe(140)
    expect(getHabitLogAmount(timeHabit, createHabitLog({ durationMinutes: 45 }))).toBe(45)
    expect(getHabitLogAmount(quantityHabit, createHabitLog({ quantity: 18 }))).toBe(18)
  })
})
