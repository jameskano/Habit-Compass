import { useQuery } from '@tanstack/react-query'
import { formatISO } from 'date-fns'

import { unwrapResult } from '@/shared/utils/result'
import { tasksRepository } from '@/integrations/repositories'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import type { ISODateString } from '@/shared/types'
import {
  getPageBlockingQueryMeta,
  type PageBlockingQueryOptions,
} from '@/shared/query/pageBlockingQuery'

const todayAsISODate = () => formatISO(new Date(), { representation: 'date' }) as ISODateString

export const useTasksQuery = (userId = MOCK_USER_ID, options: PageBlockingQueryOptions = {}) => {
  return useQuery({
    queryKey: ['tasks', userId],
    queryFn: async () => {
      unwrapResult(
        await tasksRepository.archiveCompletedPastDue({ userId, today: todayAsISODate() }),
      )
      return unwrapResult(await tasksRepository.listForUser({ userId }))
    },
    meta: getPageBlockingQueryMeta(options),
  })
}
