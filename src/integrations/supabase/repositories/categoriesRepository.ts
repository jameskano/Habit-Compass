import {
  isCategoryDefaultKey,
  sanitizeCategoryColorToken,
  sanitizeCategoryIconKey,
  type CategoriesRepository,
  type Category,
} from '@/domain/categories'
import { createAppError } from '@/shared/utils/appError'
import { err, ok, type Result } from '@/shared/utils/result'

import { getSupabaseClient } from '../client'

type CategoryRow = {
  id: string
  user_id: string
  name: string
  description: string | null
  color: string
  icon: string
  sort_order: number
  is_default: boolean
  default_key: string | null
  created_at: string
  updated_at: string
}

const mapCategory = (row: CategoryRow): Category => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  description: row.description,
  colorToken: sanitizeCategoryColorToken(row.color),
  iconName: sanitizeCategoryIconKey(row.icon),
  order: row.sort_order,
  isDefault: row.is_default,
  defaultKey: isCategoryDefaultKey(row.default_key) ? row.default_key : null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const toError = (message: string, cause: unknown) => {
  return createAppError('unknown', message, { cause })
}

const execute = async <T>(operation: () => Promise<Result<T>>): Promise<Result<T>> => {
  try {
    return await operation()
  } catch (error) {
    return err(toError('Supabase category operation failed.', error))
  }
}

export const supabaseCategoriesRepository: CategoriesRepository = {
  async listForUser({ userId }) {
    return execute(async () => {
      const supabase = getSupabaseClient()
      await supabase.rpc('ensure_default_categories_for_user', { target_user_id: userId })

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true })

      if (error) {
        return err(toError('Could not load categories.', error))
      }

      return ok((data as CategoryRow[]).map(mapCategory))
    })
  },
  async create(input) {
    return execute(async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: input.userId,
          name: input.name,
          description: input.description ?? null,
          color: input.colorToken,
          icon: input.iconName,
          sort_order: input.order,
          is_default: false,
          default_key: null,
        })
        .select('*')
        .single()

      if (error) {
        return err(toError('Could not create category.', error))
      }

      return ok(mapCategory(data as CategoryRow))
    })
  },
  async update(input) {
    return execute(async () => {
      const supabase = getSupabaseClient()
      const patch = {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.colorToken !== undefined ? { color: input.colorToken } : {}),
        ...(input.iconName !== undefined ? { icon: input.iconName } : {}),
        ...(input.order !== undefined ? { sort_order: input.order } : {}),
      }
      const { data, error } = await supabase
        .from('categories')
        .update(patch)
        .eq('id', input.id)
        .select('*')
        .single()

      if (error) {
        return err(toError('Could not update category.', error))
      }

      return ok(mapCategory(data as CategoryRow))
    })
  },
  async delete({ categoryId }) {
    return execute(async () => {
      const supabase = getSupabaseClient()
      const { error } = await supabase.rpc('delete_category_with_reassignment', {
        category_id: categoryId,
      })

      if (error) {
        return err(toError('Could not delete category.', error))
      }

      return ok(null)
    })
  },
}
