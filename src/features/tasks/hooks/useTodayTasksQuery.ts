import { useQuery } from '@tanstack/react-query'

import { unwrapResult } from '@/shared/utils/result'
import { tasksRepository } from '@/integrations/repositories'
import { mockData, MOCK_USER_ID } from '@/integrations/mock/mockData'
import {
  getPageBlockingQueryMeta,
  type PageBlockingQueryOptions,
} from '@/shared/query/pageBlockingQuery'

export const useTodayTasksQuery = (
  userId = MOCK_USER_ID,
  date = mockData.today,
  options: PageBlockingQueryOptions = {},
) => {
  return useQuery({
    queryKey: ['tasks', 'today', userId, date],
    queryFn: async () => {
      const tasks = unwrapResult(await tasksRepository.listForToday({ userId, date }))

      return {
        tasks,
        completedCount: tasks.filter((task) => task.completionStatus === 'completed').length,
      }
    },
    meta: getPageBlockingQueryMeta(options),
  })
}
