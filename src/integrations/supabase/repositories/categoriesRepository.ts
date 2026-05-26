import type { CategoriesRepository } from '@/domain/categories'
import { err } from '@/shared/utils/result'
import { createNotImplementedError } from '@/shared/utils/appError'

const error = () => err(createNotImplementedError('Supabase categories repository'))

export const supabaseCategoriesRepository: CategoriesRepository = {
  async listForUser() {
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
}
