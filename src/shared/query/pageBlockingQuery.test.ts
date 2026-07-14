import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import {
  getPageBlockingQueryMeta,
  isPageBlockingQuery,
  pageBlockingQueryMeta,
  shouldThrowPageBlockingQueryError,
} from './pageBlockingQuery'

const createQuery = (meta?: Record<string, unknown>) => {
  const queryClient = new QueryClient()

  return queryClient.getQueryCache().build(queryClient, {
    queryKey: ['test'],
    queryFn: async () => null,
    meta,
  })
}

describe('pageBlockingQuery', () => {
  it('marks only opted-in queries as page-blocking', () => {
    expect(getPageBlockingQueryMeta({ pageBlocking: true })).toBe(pageBlockingQueryMeta)
    expect(getPageBlockingQueryMeta()).toBeUndefined()
    expect(isPageBlockingQuery(createQuery(pageBlockingQueryMeta))).toBe(true)
    expect(isPageBlockingQuery(createQuery())).toBe(false)
  })

  it('only escalates page-blocking query errors', () => {
    expect(
      shouldThrowPageBlockingQueryError(new Error('Failed'), createQuery(pageBlockingQueryMeta)),
    ).toBe(true)
    expect(shouldThrowPageBlockingQueryError(new Error('Failed'), createQuery())).toBe(false)
  })
})
