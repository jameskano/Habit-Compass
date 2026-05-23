import type { MoodRepository } from '@/domain/mood'
import { err } from '@/shared/utils/result'
import { createNotImplementedError } from '@/shared/utils/appError'

const error = () => err(createNotImplementedError('Supabase mood repository'))

export const supabaseMoodRepository: MoodRepository = {
  async listForUser() {
    return error()
  },
  async getForDate() {
    return error()
  },
  async upsert() {
    return error()
  },
  async deleteForDate() {
    return error()
  },
}
