import { describe, expect, it } from 'vitest'

import { ErrorPage } from '@/features/error/ErrorPage'
import { NotFoundPage } from '@/features/not-found/NotFoundPage'

import { router } from './router'

describe('router error surfaces', () => {
  it('keeps 404 handling separate from the global non-404 error page', () => {
    expect(router.options.defaultErrorComponent).toBe(ErrorPage)
    expect(router.options.defaultNotFoundComponent).toBe(NotFoundPage)
  })
})
