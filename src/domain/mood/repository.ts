import type { ISODateString, UserId } from '@/shared/types'
import type { Result } from '@/shared/lib/result'

import type { MoodLog } from './types'

export type CreateMoodLogInput = Omit<
  MoodLog,
  'id' | 'createdAt' | 'updatedAt' | 'archivedAt' | 'deletedAt'
>

export interface MoodRepository {
  listForUser(input: { userId: UserId }): Promise<Result<MoodLog[]>>
  getForDate(input: { userId: UserId; date: ISODateString }): Promise<Result<MoodLog | null>>
  upsert(input: CreateMoodLogInput): Promise<Result<MoodLog>>
  deleteForDate(input: { userId: UserId; date: ISODateString }): Promise<Result<null>>
}
