import { useQuery } from '@tanstack/react-query'
import { formatISO } from 'date-fns'

import { unwrapResult } from '@/shared/utils/result'
import { tasksRepository } from '@/integrations/repositories'
import { mockData, MOCK_USER_ID } from '@/integrations/mock/mockData'
import type { ISODateString } from '@/shared/types'
import {
  getPageBlockingQueryMeta,
  type PageBlockingQueryOptions,
} from '@/shared/query/pageBlockingQuery'

const todayAsISODate = () => formatISO(new Date(), { representation: 'date' }) as ISODateString

export const useTodayTasksQuery = (
  userId = MOCK_USER_ID,
  date = mockData.today,
  options: PageBlockingQueryOptions = {},
) => {
  return useQuery({
    queryKey: ['tasks', 'today', userId, date],
    queryFn: async () => {
      unwrapResult(
        await tasksRepository.archiveCompletedPastDue({ userId, today: todayAsISODate() }),
      )
      const tasks = unwrapResult(await tasksRepository.listForToday({ userId, date }))

      return {
        tasks,
        completedCount: tasks.filter((task) => task.completionStatus === 'completed').length,
      }
    },
    meta: getPageBlockingQueryMeta(options),
  })
}
