import { describe, expect, it } from 'vitest'

import type { Category } from '@/domain/categories'
import { createHabit } from '@/domain/habits/logic/habitFixtures'

import {
  canAddWeeklyBigRock,
  getWeekDates,
  getWeekStart,
  groupBigRockHabitsByLifeArea,
  shiftWeek,
} from './weekPlanning.utils'

const category = (id: string, name: string): Category => ({
  id,
  userId: 'user-1',
  createdAt: '2026-05-21T08:00:00.000Z',
  updatedAt: '2026-05-21T08:00:00.000Z',
  name,
  description: null,
  colorToken: 'emerald',
  iconName: 'heartPulse',
  order: 0,
  isDefault: false,
  defaultKey: null,
})

describe('week planning utilities', () => {
  it('uses Monday as week start and returns a 7-day range', () => {
    expect(getWeekStart('2026-05-21', 1)).toBe('2026-05-18')
    expect(getWeekDates('2026-05-18', 1)).toEqual([
      '2026-05-18',
      '2026-05-19',
      '2026-05-20',
      '2026-05-21',
      '2026-05-22',
      '2026-05-23',
      '2026-05-24',
    ])
    expect(shiftWeek('2026-05-18', 1)).toBe('2026-05-25')
  })

  it('supports Sunday as a stored week-start preference', () => {
    expect(getWeekStart('2026-05-21', 0)).toBe('2026-05-17')
    expect(getWeekDates('2026-05-17', 0)).toEqual([
      '2026-05-17',
      '2026-05-18',
      '2026-05-19',
      '2026-05-20',
      '2026-05-21',
      '2026-05-22',
      '2026-05-23',
    ])
    expect(shiftWeek('2026-05-17', 1)).toBe('2026-05-24')
  })

  it('guards the max Big Rock count', () => {
    expect(canAddWeeklyBigRock(2)).toBe(true)
    expect(canAddWeeklyBigRock(3)).toBe(false)
  })

  it('groups only selected habits by their life area with uncategorized fallback', () => {
    const wellbeing = category('category-wellbeing', 'Wellbeing')
    const habits = [
      createHabit(
        { trackingType: 'binary' },
        { id: 'habit-gym', title: 'Gym', categoryId: wellbeing.id },
      ),
      createHabit(
        {
          trackingType: 'binary',
        },
        {
          id: 'habit-sleep',
          title: 'Sleep',
          categoryId: wellbeing.id,
        },
      ),
      createHabit(
        {
          trackingType: 'binary',
        },
        {
          id: 'habit-read',
          title: 'Read',
          categoryId: null,
        },
      ),
    ]

    const groups = groupBigRockHabitsByLifeArea({
      habits,
      categories: [wellbeing, category('category-work', 'Work')],
      uncategorizedLabel: 'Uncategorized',
    })

    expect(groups.map((group) => group.name)).toEqual(['Wellbeing', 'Uncategorized'])
    expect(groups[0].habits.map((habit) => habit.title)).toEqual(['Gym', 'Sleep'])
    expect(groups[1].habits.map((habit) => habit.title)).toEqual(['Read'])
  })
})
