import type { Category } from '@/domain/categories'
import type { Habit, HabitInactivityReason, HabitLog } from '@/domain/habits'
import type { MoodLog } from '@/domain/mood'
import type { WeeklyBigRock, WeeklyPlan } from '@/domain/planning'
import type { RecurrentTask, RecurrentTaskOccurrence } from '@/domain/recurrent-tasks'
import type { Reflection } from '@/domain/reflections'
import type { Task } from '@/domain/tasks'
import type { EntityId, ISODateString, UserId } from '@/shared/types'
import type { Result } from '@/shared/utils/result'

export const exportFormats = ['csv', 'json'] as const

export type ExportFormat = (typeof exportFormats)[number]

export type ExportFile = {
  blob: Blob
  filename: string
  mimeType: string
}

export type ExportRequest = {
  userId: UserId
  format: ExportFormat
  generatedAt?: Date
}

export type ExportSourceData = {
  categories: Category[]
  habits: Habit[]
  habitLogs: HabitLog[]
  tasks: Task[]
  recurrentTasks: RecurrentTask[]
  recurrentTaskLogs: RecurrentTaskOccurrence[]
  moodLogs: MoodLog[]
  reflections: Reflection[]
  weeklyRecords: WeeklyPlan[]
  weeklyBigRocks: WeeklyBigRock[]
}

type StripUserId<T extends { userId: UserId }> = Omit<T, 'userId'>

export type ExportCategory = StripUserId<Category>
export type ExportHabit = StripUserId<Omit<Habit, 'inactivityPeriods'>>
export type ExportHabitLog = StripUserId<HabitLog>
export type ExportTask = StripUserId<Task>
export type ExportRecurrentTask = StripUserId<RecurrentTask>
export type ExportRecurrentTaskLog = StripUserId<RecurrentTaskOccurrence> & {
  note: string | null
}
export type ExportMoodLog = StripUserId<MoodLog> & {
  energy: number | null
  stress: number | null
  note: string | null
}
export type ExportReflection = StripUserId<Reflection>
export type ExportWeeklyRecord = StripUserId<WeeklyPlan>
export type ExportWeeklyBigRock = StripUserId<WeeklyBigRock>

export type ExportHabitInactivityPeriod = {
  id: EntityId
  habitId: EntityId
  reason: HabitInactivityReason
  startsOn: ISODateString
  resumesOn: ISODateString | null
  createdAt: string
  updatedAt: string
}

export type HabitCompassExportData = {
  categories: ExportCategory[]
  habits: ExportHabit[]
  habitInactivityPeriods: ExportHabitInactivityPeriod[]
  tasks: ExportTask[]
  recurrentTasks: ExportRecurrentTask[]
  recurrentTaskLogs: ExportRecurrentTaskLog[]
  habitLogs: ExportHabitLog[]
  moodLogs: ExportMoodLog[]
  reflections: ExportReflection[]
  weeklyRecords: ExportWeeklyRecord[]
  weeklyBigRocks: ExportWeeklyBigRock[]
}

export type HabitCompassJsonExport = {
  schemaVersion: string
  generatedAt: string
  app: {
    name: 'Habit Compass'
    exportFormat: 'json'
  }
  data: HabitCompassExportData
}

export type DataExportRepository = {
  exportData(input: ExportRequest): Promise<Result<ExportFile>>
}
