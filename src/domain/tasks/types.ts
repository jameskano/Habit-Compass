import type { BaseEntityFields, EntityId, ISODateString, ISODateTimeString, LifecycleStatus } from '@/shared/types'

import type { taskCompletionStatuses } from './constants'

export type TaskCompletionStatus = (typeof taskCompletionStatuses)[number]

export type Task = BaseEntityFields & {
  title: string
  notes?: string | null
  dueDate?: ISODateString | null
  completedAt?: ISODateTimeString | null
  categoryId?: EntityId | null
  lifecycleStatus: LifecycleStatus
  completionStatus: TaskCompletionStatus
}
