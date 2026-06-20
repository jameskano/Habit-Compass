import type { DataExportRepository } from '@/domain/export'
import { buildExportBlob, buildExportData, buildExportFilename } from '@/domain/export'
import { createAppError } from '@/shared/utils/appError'
import { err, ok } from '@/shared/utils/result'

import { getMockState } from './mockData'

export const mockDataExportRepository: DataExportRepository = {
  async exportData({ format, generatedAt = new Date(), userId }) {
    const state = getMockState()

    if (!state.authSession.signedIn) {
      return err(createAppError('unauthorized', 'No signed-in user is available.'))
    }

    const exportData = buildExportData({
      categories: state.categories.filter((category) => category.userId === userId),
      habits: state.habits.filter((habit) => habit.userId === userId),
      habitLogs: state.habitLogs.filter((log) => log.userId === userId),
      tasks: state.tasks.filter((task) => task.userId === userId),
      recurrentTasks: state.recurrentTasks.filter((task) => task.userId === userId),
      recurrentTaskLogs: state.recurrentTaskOccurrences.filter((log) => log.userId === userId),
      moodLogs: state.moodLogs.filter((log) => log.userId === userId),
      reflections: [],
      weeklyRecords: state.weeklyPlans.filter((plan) => plan.userId === userId),
      weeklyBigRocks: state.weeklyBigRocks.filter((bigRock) => bigRock.userId === userId),
    })

    state.dataExportRequests.push(format)

    const mimeType = format === 'csv' ? 'application/zip' : 'application/json'
    return ok({
      blob: buildExportBlob(exportData, format, generatedAt),
      filename: buildExportFilename(format, generatedAt),
      mimeType,
    })
  },
}
