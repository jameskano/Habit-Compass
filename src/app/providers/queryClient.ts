import { QueryClient } from '@tanstack/react-query'

import { shouldThrowPageBlockingQueryError } from '@/shared/query/pageBlockingQuery'

export const createAppQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        throwOnError: shouldThrowPageBlockingQueryError,
      },
    },
  })
