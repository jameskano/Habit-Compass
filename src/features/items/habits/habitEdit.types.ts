import type { Category } from '@/domain/categories'
import type { Habit, UpdateHabitInput } from '@/domain/habits'

import type { HabitDangerAction } from './HabitConfirmationDialog'

export type HabitEditTabProps = {
  habit: Habit
  categories: Category[]
  today: string
  archived: boolean
  pending: boolean
  onSave: (input: UpdateHabitInput, options?: { archiveAfterSave?: boolean }) => void
  onArchive: () => void
  onRequestDangerAction: (action: HabitDangerAction) => void
}
