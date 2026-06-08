import type { HabitsRepository } from '@/domain/habits'
import { err } from '@/shared/utils/result'
import { createNotImplementedError } from '@/shared/utils/appError'

const error = () => err(createNotImplementedError('Supabase habits repository'))

export const supabaseHabitsRepository: HabitsRepository = {
  async listForUser() {
    return error()
  },
  async listForToday() {
    return error()
  },
  async listLogsForDate() {
    return error()
  },
  async listLogsForRange() {
    return error()
  },
  async create() {
    return error()
  },
  async update() {
    return error()
  },
  async archive() {
    return error()
  },
  async delete() {
    return error()
  },
  async restore() {
    return error()
  },
  async upsertLog() {
    return error()
  },
  async removeLog() {
    return error()
  },
  async hardResetLogs() {
    return error()
  },
  async reorder() {
    return error()
  },
}
