import { useQuery } from '@tanstack/react-query'

import { unwrapResult } from '@/shared/utils/result'
import { habitsRepository } from '@/integrations/repositories'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import {
  getPageBlockingQueryMeta,
  type PageBlockingQueryOptions,
} from '@/shared/query/pageBlockingQuery'

export const useHabitsQuery = (userId = MOCK_USER_ID, options: PageBlockingQueryOptions = {}) => {
  return useQuery({
    queryKey: ['habits', userId],
    queryFn: async () => unwrapResult(await habitsRepository.listForUser({ userId })),
    meta: getPageBlockingQueryMeta(options),
  })
}
