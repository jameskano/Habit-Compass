import { describe, expect, it } from 'vitest'

import { AppError } from '@/shared/utils/appError'

import { toSupabaseError } from './supabaseRepository.utils'

describe('toSupabaseError', () => {
  it('maps free plan limit database errors to typed validation details', () => {
    const error = toSupabaseError('Create failed.', {
      message: 'free_plan_limit_exceeded:recurrentTask',
    })

    expect(error).toBeInstanceOf(AppError)
    expect(error.code).toBe('validation')
    expect(error.message).toBe('free_plan_limit_exceeded:recurrentTask')
    expect(error.details).toEqual({ limitKind: 'recurrentTask' })
  })
})
