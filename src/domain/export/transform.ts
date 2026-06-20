import { buildCsvExportFiles } from './csv'
import { createStoredZip } from './zip'
import type {
  ExportFormat,
  ExportHabit,
  ExportHabitInactivityPeriod,
  ExportSourceData,
  HabitCompassExportData,
  HabitCompassJsonExport,
} from './types'

export const EXPORT_SCHEMA_VERSION = '1.0.0'
export const EXPORT_APP_NAME = 'Habit Compass'

const stripUserId = <T extends { userId: string }>(record: T): Omit<T, 'userId'> => {
  const exportRecord: Partial<T> = { ...record }
  delete exportRecord.userId
  return exportRecord as Omit<T, 'userId'>
}

const sortByOrder = <T extends { order: number }>(left: T, right: T) => left.order - right.order
const sortBySortOrder = <T extends { sortOrder: number }>(left: T, right: T) =>
  left.sortOrder - right.sortOrder

export const buildExportData = (source: ExportSourceData): HabitCompassExportData => {
  const habitInactivityPeriods: ExportHabitInactivityPeriod[] = source.habits.flatMap((habit) =>
    habit.inactivityPeriods.map((period, index) => ({
      id: `${habit.id}-inactivity-${index + 1}`,
      habitId: habit.id,
      reason: period.reason,
      startsOn: period.startsOn,
      resumesOn: period.resumesOn ?? null,
      createdAt: habit.createdAt,
      updatedAt: habit.updatedAt,
    })),
  )

  return {
    categories: source.categories.map(stripUserId).sort(sortByOrder),
    habits: source.habits
      .map((habit) => {
        const exportHabit: Partial<typeof habit> = { ...habit }
        delete exportHabit.userId
        delete exportHabit.inactivityPeriods
        return exportHabit as ExportHabit
      })
      .sort(sortByOrder),
    habitInactivityPeriods,
    tasks: source.tasks.map(stripUserId).sort(sortByOrder),
    recurrentTasks: source.recurrentTasks.map(stripUserId).sort(sortByOrder),
    recurrentTaskLogs: source.recurrentTaskLogs.map((log) => ({
      ...stripUserId(log),
      note: null,
    })),
    habitLogs: source.habitLogs.map(stripUserId),
    moodLogs: source.moodLogs.map((moodLog) => ({
      ...stripUserId(moodLog),
      energy: null,
      stress: null,
      note: null,
    })),
    reflections: source.reflections.map(stripUserId),
    weeklyRecords: source.weeklyRecords.map(stripUserId),
    weeklyBigRocks: source.weeklyBigRocks.map(stripUserId).sort(sortBySortOrder),
  }
}

export const buildJsonExport = (
  data: HabitCompassExportData,
  generatedAt: Date,
): HabitCompassJsonExport => ({
  schemaVersion: EXPORT_SCHEMA_VERSION,
  generatedAt: generatedAt.toISOString(),
  app: {
    name: EXPORT_APP_NAME,
    exportFormat: 'json',
  },
  data,
})

export const buildExportFilename = (format: ExportFormat, generatedAt: Date) => {
  const year = generatedAt.getFullYear()
  const month = String(generatedAt.getMonth() + 1).padStart(2, '0')
  const day = String(generatedAt.getDate()).padStart(2, '0')
  const extension = format === 'csv' ? 'zip' : 'json'

  return `habit-compass-export-${year}-${month}-${day}.${extension}`
}

export const buildCsvZipBytes = (data: HabitCompassExportData) => {
  const csvFiles = buildCsvExportFiles(data)

  return createStoredZip(
    Object.entries(csvFiles).map(([path, content]) => ({
      path,
      content,
    })),
  )
}

export const buildExportBlob = (
  data: HabitCompassExportData,
  format: ExportFormat,
  generatedAt: Date,
) => {
  if (format === 'json') {
    return new Blob([JSON.stringify(buildJsonExport(data, generatedAt), null, 2)], {
      type: 'application/json',
    })
  }

  return new Blob([buildCsvZipBytes(data)], { type: 'application/zip' })
}
