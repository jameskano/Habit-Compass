import { describe, expect, it } from 'vitest'

import {
  buildHabitGoal,
  buildRecurrence,
  buildSchedule,
  initialFrequency,
} from './createItem.utils'

describe('habit creation frequency mappings', () => {
  it('persists certain days per period as a binary habit frequency', () => {
    const frequency = {
      ...initialFrequency(),
      kind: 'certainDaysPerPeriod' as const,
      targetCount: 4,
      period: 'month' as const,
    }

    expect(buildSchedule(frequency)).toEqual({
      kind: 'certainDaysPerPeriod',
      targetDays: 4,
      period: 'month',
    })
    expect(
      buildHabitGoal({
        completionMode: 'binary',
        scope: 'session',
        period: 'week',
        standardText: 'Done',
        minimumText: '',
        standardAmount: 1,
        minimumAmount: '',
        unitLabel: '',
        frequency,
      }),
    ).toEqual({ trackingType: 'binary', standardDescription: 'Done' })
  })

  it('keeps a measurable-per-session goal independent from its certain-days frequency', () => {
    const frequency = {
      ...initialFrequency(),
      kind: 'certainDaysPerPeriod' as const,
      targetCount: 3,
      period: 'week' as const,
    }

    expect(
      buildHabitGoal({
        completionMode: 'measurable',
        scope: 'session',
        period: 'week',
        standardText: '',
        minimumText: '',
        standardAmount: 30,
        minimumAmount: 10,
        unitLabel: 'minutes',
        frequency,
      }),
    ).toEqual({
      trackingType: 'measurablePerSession',
      targetAmount: 30,
      minimumAmount: 10,
      unitLabel: 'minutes',
    })
    expect(buildSchedule(frequency)).toEqual({
      kind: 'certainDaysPerPeriod',
      targetDays: 3,
      period: 'week',
    })
    expect(buildRecurrence(frequency)).toEqual({ kind: 'daily' })
  })
})
