import { describe, expect, it } from 'vitest'

import { HabitGoalConfigSchema } from './schemas'

describe('HabitGoalConfigSchema', () => {
  it('parses a binary goal', () => {
    expect(HabitGoalConfigSchema.parse({ trackingType: 'binary' }).trackingType).toBe('binary')
  })

  it('parses a frequency goal with a custom period', () => {
    const goal = HabitGoalConfigSchema.parse({
      trackingType: 'timesPerPeriod',
      targetCount: 3,
      period: 'custom',
      customPeriodDays: 10,
    })

    if (goal.trackingType !== 'timesPerPeriod') {
      throw new Error('Expected a timesPerPeriod goal')
    }

    expect(goal.customPeriodDays).toBe(10)
  })
})
