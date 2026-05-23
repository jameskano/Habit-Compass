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
  async create() {
    return error()
  },
  async update() {
    return error()
  },
  async archive() {
    return error()
  },
  async softDelete() {
    return error()
  },
  async restore() {
    return error()
  },
  async logCompletion() {
    return error()
  },
}
