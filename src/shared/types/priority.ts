import { z } from 'zod'

export const itemPriorities = ['low', 'medium', 'high'] as const
export const habitPriorities = [...itemPriorities, 'essential'] as const

export type ItemPriority = (typeof itemPriorities)[number]
export type HabitPriority = (typeof habitPriorities)[number]

export const ItemPrioritySchema = z.enum(itemPriorities)
export const HabitPrioritySchema = z.enum(habitPriorities)
