import type { Category } from '@/domain/categories'
import type { RecurrentTask } from '@/domain/recurrent-tasks'

export type RecurrentTaskEditProps = {
  task: RecurrentTask
  categories: Category[]
  today: string
  onClose: () => void
  onArchived: (task: RecurrentTask) => void
  onDeleted: (task: RecurrentTask) => void
}
