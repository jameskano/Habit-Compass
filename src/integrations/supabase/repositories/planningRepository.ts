import type { PlanningRepository } from '@/domain/planning'
import { createNotImplementedError } from '@/shared/utils/appError'
import { err } from '@/shared/utils/result'

const error = () => err(createNotImplementedError('Supabase planning repository'))

export const supabasePlanningRepository: PlanningRepository = {
  async listForUser() {
    return error()
  },
  async getForWeek() {
    return error()
  },
  async create() {
    return error()
  },
  async update() {
    return error()
  },
  async listBigRocks() {
    return error()
  },
  async addBigRock() {
    return error()
  },
  async removeBigRock() {
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
