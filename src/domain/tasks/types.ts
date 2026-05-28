import type { EntityId, ISODateString, ISODateTimeString, ItemEntityFields, ItemPriority, LifecycleStatus } from '@/shared/types'

import type { taskCompletionStatuses } from './constants'

export type TaskCompletionStatus = (typeof taskCompletionStatuses)[number]

export type Task = ItemEntityFields & {
  title: string
  notes?: string | null
  dueDate?: ISODateString | null
  completedAt?: ISODateTimeString | null
  categoryId?: EntityId | null
  priority: ItemPriority
  carryForward: boolean
  order: number
  lifecycleStatus: LifecycleStatus
  completionStatus: TaskCompletionStatus
}
