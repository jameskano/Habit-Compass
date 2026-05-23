import type { BaseEntityFields, ISODateString, ISODateTimeString } from '@/shared/types'

import type { moodValues } from './constants'

export type MoodValue = (typeof moodValues)[number]

export type MoodLog = BaseEntityFields & {
  loggedForDate: ISODateString
  loggedAt: ISODateTimeString
  mood: MoodValue
}
