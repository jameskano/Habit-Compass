import { describe, expect, it } from 'vitest'

import { HabitPrioritySchema, ItemPrioritySchema } from './priority'

describe('item priority schemas', () => {
  it('limits standard item priorities to three levels', () => {
    expect(ItemPrioritySchema.safeParse('low').success).toBe(true)
    expect(ItemPrioritySchema.safeParse('high').success).toBe(true)
    expect(ItemPrioritySchema.safeParse('essential').success).toBe(false)
  })

  it('permits essential only for habits', () => {
    expect(HabitPrioritySchema.safeParse('essential').success).toBe(true)
    expect(HabitPrioritySchema.safeParse('critical').success).toBe(false)
  })
})
