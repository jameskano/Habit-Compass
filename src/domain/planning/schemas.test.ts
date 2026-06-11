import { describe, expect, it } from 'vitest'

import { WeeklyBigRockSchema, WeeklyPlanSchema } from './schemas'

const baseFields = {
  id: 'weekly-plan-1',
  userId: 'user-1',
  createdAt: '2026-05-21T08:00:00.000Z',
  updatedAt: '2026-05-21T08:00:00.000Z',
  archivedAt: null,
  deletedAt: null,
}

describe('WeeklyPlanSchema', () => {
  it('parses an empty weekly plan payload', () => {
    const result = WeeklyPlanSchema.parse({
      ...baseFields,
      weekStartDate: '2026-05-18',
      focusText: null,
      reviewWentWell: null,
      reviewGotInWay: null,
      reviewAdjustNextWeek: null,
    })

    expect(result.weekStartDate).toBe('2026-05-18')
  })

  it('rejects focus text longer than 100 characters and legacy highlight arrays', () => {
    expect(
      WeeklyPlanSchema.safeParse({
        ...baseFields,
        weekStartDate: '2026-05-18',
        focusText: 'a'.repeat(101),
      }).success,
    ).toBe(false)
    expect(
      WeeklyPlanSchema.safeParse({
        ...baseFields,
        weekStartDate: '2026-05-18',
        highlightedTaskIds: ['task-1'],
      }).success,
    ).toBe(false)
  })
})

describe('WeeklyBigRockSchema', () => {
  it('parses a habit reference for a weekly plan', () => {
    const result = WeeklyBigRockSchema.parse({
      ...baseFields,
      id: 'big-rock-1',
      weeklyPlanId: 'weekly-plan-1',
      habitId: 'habit-1',
      sortOrder: 0,
    })

    expect(result.habitId).toBe('habit-1')
  })

  it('rejects task-oriented references', () => {
    expect(
      WeeklyBigRockSchema.safeParse({
        ...baseFields,
        id: 'big-rock-1',
        weeklyPlanId: 'weekly-plan-1',
        taskId: 'task-1',
        sortOrder: 0,
      }).success,
    ).toBe(false)
  })
})
