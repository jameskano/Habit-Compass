import { addDays, formatISO, parseISO, startOfWeek } from 'date-fns'

import type { Category } from '@/domain/categories'
import type { Habit } from '@/domain/habits'
import type { EntityId, ISODateString } from '@/shared/types'

import { MAX_WEEKLY_BIG_ROCKS } from './constants'

export type WeekStartsOn = 0 | 1

export type LifeAreaGroup = {
  id: EntityId | 'uncategorized'
  name: string
  colorToken: string | null
  iconName: string | null
  habits: Habit[]
}

export const toISODate = (value: Date) => {
  return formatISO(value, { representation: 'date' }) as ISODateString
}

export const getWeekStart = (date: ISODateString, weekStartsOn: WeekStartsOn = 1) => {
  return toISODate(startOfWeek(parseISO(date), { weekStartsOn }))
}

export const getWeekDates = (weekStartDate: ISODateString, weekStartsOn: WeekStartsOn = 1) => {
  const start = parseISO(getWeekStart(weekStartDate, weekStartsOn))
  return Array.from({ length: 7 }, (_, index) => toISODate(addDays(start, index)))
}

export const shiftWeek = (weekStartDate: ISODateString, amount: number) => {
  return toISODate(addDays(parseISO(weekStartDate), amount * 7))
}

export const canAddWeeklyBigRock = (selectedCount: number) => {
  return selectedCount < MAX_WEEKLY_BIG_ROCKS
}

export const groupBigRockHabitsByLifeArea = (input: {
  habits: Habit[]
  categories: Category[]
  uncategorizedLabel: string
}) => {
  const categoriesById = new Map(input.categories.map((category) => [category.id, category]))
  const groups = new Map<EntityId | 'uncategorized', LifeAreaGroup>()

  for (const habit of input.habits) {
    const category = habit.categoryId ? categoriesById.get(habit.categoryId) : null
    const id = category?.id ?? 'uncategorized'
    const existingGroup = groups.get(id)

    if (existingGroup) {
      existingGroup.habits.push(habit)
      continue
    }

    groups.set(id, {
      id,
      name: category?.name ?? input.uncategorizedLabel,
      colorToken: category?.colorToken ?? null,
      iconName: category?.iconName ?? null,
      habits: [habit],
    })
  }

  return Array.from(groups.values())
}
