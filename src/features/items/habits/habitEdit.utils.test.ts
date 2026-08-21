import { describe, expect, it } from 'vitest'

import { createHabit } from '@/domain/habits/logic/habitFixtures'

import { buildHabitUpdateInput, valuesForHabit } from './habitEdit.utils'

describe('habit edit mappings', () => {
  it('round-trips a binary certain-days frequency independently from its goal', () => {
    const habit = createHabit(
      { trackingType: 'binary', standardDescription: 'Practice' },
      {
        categoryId: 'category-1',
        scheduleRule: { kind: 'certainDaysPerPeriod', targetDays: 5, period: 'month' },
      },
    )

    const update = buildHabitUpdateInput(habit.id, valuesForHabit(habit), 'category-1')

    expect(update).toMatchObject({
      trackingType: 'binary',
      goalConfig: { trackingType: 'binary', standardDescription: 'Practice' },
      scheduleRule: { kind: 'certainDaysPerPeriod', targetDays: 5, period: 'month' },
    })
  })

  it('round-trips a measurable-per-session goal with a certain-days frequency', () => {
    const habit = createHabit(
      {
        trackingType: 'measurablePerSession',
        targetAmount: 30,
        minimumAmount: 10,
        unitLabel: 'minutes',
      },
      {
        categoryId: 'category-1',
        scheduleRule: { kind: 'certainDaysPerPeriod', targetDays: 3, period: 'week' },
      },
    )

    const update = buildHabitUpdateInput(habit.id, valuesForHabit(habit), 'category-1')

    expect(update).toMatchObject({
      trackingType: 'measurablePerSession',
      goalConfig: {
        trackingType: 'measurablePerSession',
        targetAmount: 30,
        minimumAmount: 10,
        unitLabel: 'minutes',
      },
      scheduleRule: { kind: 'certainDaysPerPeriod', targetDays: 3, period: 'week' },
    })
  })
})
