import type { BaseEntityFields, EntityId, ISODateString } from '@/shared/types'

import type { reflectionKinds } from './constants'

export type ReflectionKind = (typeof reflectionKinds)[number]

export type Reflection = BaseEntityFields & {
  kind: ReflectionKind
  content: string
  recordedForDate?: ISODateString | null
  weekStartDate?: ISODateString | null
  moodLogId?: EntityId | null
  promptKey?: string | null
}
