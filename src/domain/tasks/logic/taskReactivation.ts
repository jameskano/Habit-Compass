import type { ISODateTimeString } from '@/shared/types'

import type { Task } from '../types'

export const canReactivateTask = (task: Task) =>
  task.lifecycleStatus === 'archived' && task.completionStatus !== 'completed'

export const reactivateTask = (task: Task, reactivatedAt: ISODateTimeString): Task | null => {
  if (!canReactivateTask(task)) {
    return null
  }

  return {
    ...task,
    lifecycleStatus: 'active',
    completionStatus: 'pending',
    completedAt: null,
    archivedAt: null,
    updatedAt: reactivatedAt,
  }
}
