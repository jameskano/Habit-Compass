import type { CategoriesRepository } from '@/domain/categories'
import { err } from '@/shared/lib/result'
import { createNotImplementedError } from '@/shared/lib/appError'

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
  async softDelete() {
    return error()
  },
  async restore() {
    return error()
  },
}
