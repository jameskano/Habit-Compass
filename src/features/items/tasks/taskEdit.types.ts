import type { Category } from '@/domain/categories'
import type { Task } from '@/domain/tasks'

export type TaskEditProps = {
  task: Task
  categories: Category[]
  onClose: () => void
  onArchived: (task: Task) => void
  onDeleted: (task: Task) => void
}
