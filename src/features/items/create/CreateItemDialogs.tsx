import { CategoryFormSheet } from '@/features/categories/CategoryFormSheet'
import { useCategoriesQuery } from '@/features/categories/hooks/useCategoriesQuery'

import type { CreateItemDialogsProps } from './createItem.types'
import { HabitCreate } from './HabitCreate'
import { RecurrentTaskCreate } from './RecurrentTaskCreate'
import { TaskCreate } from './TaskCreate'

export const CreateItemDialogs = ({ kind, onClose, onLimitReached }: CreateItemDialogsProps) => {
  const categories = useCategoriesQuery().data ?? []

  if (kind === 'habit') return <HabitCreate onClose={onClose} onLimitReached={onLimitReached} />
  if (kind === 'task') return <TaskCreate onClose={onClose} onLimitReached={onLimitReached} />
  if (kind === 'recurrentTask') {
    return <RecurrentTaskCreate onClose={onClose} onLimitReached={onLimitReached} />
  }
  if (kind === 'category') {
    return (
      <CategoryFormSheet
        open
        mode="create"
        categories={categories}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            onClose()
          }
        }}
      />
    )
  }
  return null
}
