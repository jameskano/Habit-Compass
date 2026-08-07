import type { ISODateString } from '@/shared/types'

import type { Task } from '../types'

export const shouldAutoArchiveCompletedTask = (task: Task, today: ISODateString) => {
  return (
    task.lifecycleStatus === 'active' &&
    task.completionStatus === 'completed' &&
    Boolean(task.dueDate) &&
    task.dueDate! < today
  )
}
