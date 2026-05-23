import { useQuery } from '@tanstack/react-query'

import { unwrapResult } from '@/shared/lib/result'
import { tasksRepository } from '@/integrations/repositories'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'

export function useTasksQuery(userId = MOCK_USER_ID) {
  return useQuery({
    queryKey: ['tasks', userId],
    queryFn: async () => unwrapResult(await tasksRepository.listForUser({ userId })),
  })
}
