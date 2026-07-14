import { useQuery } from '@tanstack/react-query'

import { unwrapResult } from '@/shared/utils/result'
import { tasksRepository } from '@/integrations/repositories'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import {
  getPageBlockingQueryMeta,
  type PageBlockingQueryOptions,
} from '@/shared/query/pageBlockingQuery'

export const useTasksQuery = (userId = MOCK_USER_ID, options: PageBlockingQueryOptions = {}) => {
  return useQuery({
    queryKey: ['tasks', userId],
    queryFn: async () => unwrapResult(await tasksRepository.listForUser({ userId })),
    meta: getPageBlockingQueryMeta(options),
  })
}
