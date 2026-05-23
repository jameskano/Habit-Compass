import { ok } from '@/shared/lib/result'
import type { MoodLog, MoodRepository } from '@/domain/mood'

import { getMockState } from './mockData'

export const mockMoodRepository: MoodRepository = {
  async listForUser({ userId }) {
    return ok(getMockState().moodLogs.filter((moodLog) => moodLog.userId === userId))
  },

  async getForDate({ userId, date }) {
    return ok(
      getMockState().moodLogs.find(
        (moodLog) => moodLog.userId === userId && moodLog.loggedForDate === date,
      ) ?? null,
    )
  },

  async upsert(input) {
    const state = getMockState()
    const index = state.moodLogs.findIndex(
      (moodLog) => moodLog.userId === input.userId && moodLog.loggedForDate === input.loggedForDate,
    )

    const nextMoodLog: MoodLog = {
      id: index >= 0 ? state.moodLogs[index].id : `mood-log-${state.moodLogs.length + 1}`,
      ...input,
      createdAt: index >= 0 ? state.moodLogs[index].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
      deletedAt: null,
    }

    if (index >= 0) {
      state.moodLogs[index] = nextMoodLog
    } else {
      state.moodLogs.push(nextMoodLog)
    }

    return ok(nextMoodLog)
  },

  async deleteForDate({ userId, date }) {
    const state = getMockState()
    state.moodLogs = state.moodLogs.filter(
      (moodLog) => !(moodLog.userId === userId && moodLog.loggedForDate === date),
    )

    return ok(null)
  },
}
