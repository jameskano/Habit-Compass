import { describe, expect, it } from 'vitest'

import { calculateCalendarCompletion } from '@/domain/stats/logic/calculateCalendarCompletion'
import { calculateCompletionPercentage } from '@/domain/stats/logic/calculateCompletionPercentage'
import { calculatePeriodProgress } from '@/domain/stats/logic/calculatePeriodProgress'

describe('stats harness', () => {
  it('calculates a simple completion percentage', () => {
    expect(calculateCompletionPercentage(3, 4)).toBe(75)
  })

  it('calculates a calendar completion state', () => {
    expect(
      calculateCalendarCompletion({
        hasCompleted: true,
        hasSkipped: false,
        hasMissed: false,
        progressRatio: 0.5,
      }),
    ).toBe('partial')
  })

  it('calculates period progress for time and quantity goals', () => {
    expect(calculatePeriodProgress(45, 60).remaining).toBe(15)
    expect(calculatePeriodProgress(12, 10).isComplete).toBe(true)
  })
})
