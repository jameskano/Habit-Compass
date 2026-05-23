import { useQuery } from '@tanstack/react-query'

import { unwrapResult } from '@/shared/lib/result'
import { habitsRepository } from '@/integrations/repositories'
import { mockData, MOCK_USER_ID } from '@/integrations/mock/mockData'

export function useTodayHabitsQuery(userId = MOCK_USER_ID, date = mockData.today) {
  return useQuery({
    queryKey: ['habits', 'today', userId, date],
    queryFn: async () => {
      const habits = unwrapResult(await habitsRepository.listForToday({ userId, date }))
      const logs = unwrapResult(await habitsRepository.listLogsForDate({ userId, date }))

      return {
        habits,
        logs,
        completedCount: logs.filter((log) => log.status === 'completed').length,
      }
    },
  })
}
