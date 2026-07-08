import { createAppError } from '@/shared/utils/appError'
import { err, ok, type Result } from '@/shared/utils/result'

import { getSupabaseClient } from '../client'

export const getSignedInUserId = async (): Promise<Result<string>> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return err(
      createAppError('unauthorized', 'Could not load the signed-in user.', {
        cause: error,
      }),
    )
  }

  return ok(data.user.id)
}

export const toSupabaseError = (message: string, cause: unknown) =>
  createAppError('unknown', message, { cause })

export const executeSupabaseOperation = async <T>(
  operation: () => Promise<Result<T>>,
  message = 'Supabase repository operation failed.',
): Promise<Result<T>> => {
  try {
    return await operation()
  } catch (error) {
    return err(toSupabaseError(message, error))
  }
}
