import { useQuery } from '@tanstack/react-query'

import { unwrapResult } from '@/shared/utils/result'
import { categoriesRepository } from '@/integrations/repositories'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import {
  getPageBlockingQueryMeta,
  type PageBlockingQueryOptions,
} from '@/shared/query/pageBlockingQuery'

export const useCategoriesQuery = (
  userId = MOCK_USER_ID,
  options: PageBlockingQueryOptions = {},
) => {
  return useQuery({
    queryKey: ['categories', userId],
    queryFn: async () => unwrapResult(await categoriesRepository.listForUser({ userId })),
    meta: getPageBlockingQueryMeta(options),
  })
}
