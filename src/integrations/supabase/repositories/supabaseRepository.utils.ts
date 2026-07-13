import { getFreePlanLimitErrorKind } from '@/domain/subscriptions'
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

const getErrorMessage = (cause: unknown) => {
  if (cause instanceof Error) {
    return cause.message
  }
  if (
    cause &&
    typeof cause === 'object' &&
    'message' in cause &&
    typeof cause.message === 'string'
  ) {
    return cause.message
  }
  return String(cause ?? '')
}

export const toSupabaseError = (message: string, cause: unknown) => {
  const limitKind = getFreePlanLimitErrorKind(getErrorMessage(cause))

  if (limitKind) {
    return createAppError('validation', `free_plan_limit_exceeded:${limitKind}`, {
      cause,
      details: { limitKind },
    })
  }

  return createAppError('unknown', message, { cause })
}

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
