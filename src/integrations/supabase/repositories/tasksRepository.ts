import type { TasksRepository } from '@/domain/tasks'
import { err } from '@/shared/lib/result'
import { createNotImplementedError } from '@/shared/lib/appError'

const error = () => err(createNotImplementedError('Supabase tasks repository'))

export const supabaseTasksRepository: TasksRepository = {
  async listForUser() {
    return error()
  },
  async listForToday() {
    return error()
  },
  async create() {
    return error()
  },
  async update() {
    return error()
  },
  async setCompletionStatus() {
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
}
