import { useQuery } from '@tanstack/react-query'

import { deriveRecurrentOccurrences } from '@/domain/recurrent-tasks'
import { mockData, MOCK_USER_ID } from '@/integrations/mock/mockData'
import { recurrentTasksRepository } from '@/integrations/repositories'
import { unwrapResult } from '@/shared/utils/result'

export function useTodayRecurrentTasksQuery(userId = MOCK_USER_ID, date = mockData.today) {
  return useQuery({
    queryKey: ['recurrent-tasks', 'today', userId, date],
    queryFn: async () => {
      const tasks = unwrapResult(await recurrentTasksRepository.listForUser({ userId }))
      const storedOccurrences = unwrapResult(
        await recurrentTasksRepository.listOccurrencesForRange({ userId, from: date, to: date }),
      )
      const dueTasks = tasks.filter((task) => task.lifecycleStatus === 'active')
      const occurrences = dueTasks.flatMap((task) =>
        deriveRecurrentOccurrences({
          task,
          storedOccurrences: storedOccurrences.filter(
            (occurrence) => occurrence.recurrentTaskId === task.id,
          ),
          from: date,
          to: date,
          today: date,
        }),
      )
      const dueTaskIds = new Set(occurrences.map((occurrence) => occurrence.recurrentTaskId))

      return {
        tasks: dueTasks.filter((task) => dueTaskIds.has(task.id)),
        occurrences,
        completedCount: occurrences.filter((occurrence) => occurrence.status === 'completed')
          .length,
      }
    },
  })
}
