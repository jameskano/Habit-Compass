import { useQuery } from '@tanstack/react-query'

import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import { recurrentTasksRepository } from '@/integrations/repositories'
import {
  getPageBlockingQueryMeta,
  type PageBlockingQueryOptions,
} from '@/shared/query/pageBlockingQuery'
import { unwrapResult } from '@/shared/utils/result'

export const useRecurrentTasksQuery = (
  userId = MOCK_USER_ID,
  options: PageBlockingQueryOptions = {},
) => {
  return useQuery({
    queryKey: ['recurrent-tasks', userId],
    queryFn: async () => unwrapResult(await recurrentTasksRepository.listForUser({ userId })),
    meta: getPageBlockingQueryMeta(options),
  })
}
