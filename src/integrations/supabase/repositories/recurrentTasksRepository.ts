import type { RecurrentTasksRepository } from '@/domain/recurrent-tasks'
import { createNotImplementedError } from '@/shared/utils/appError'
import { err } from '@/shared/utils/result'

const error = () => err(createNotImplementedError('Supabase recurrent tasks repository'))

export const supabaseRecurrentTasksRepository: RecurrentTasksRepository = {
  async listForUser() {
    return error()
  },
  async listForToday() {
    return error()
  },
  async listOccurrencesForRange() {
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
  async reorder() {
    return error()
  },
  async logCompletion() {
    return error()
  },
}
