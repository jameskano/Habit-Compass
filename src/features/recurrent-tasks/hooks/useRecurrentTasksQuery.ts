import { useQuery } from '@tanstack/react-query'

import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import { recurrentTasksRepository } from '@/integrations/repositories'
import { unwrapResult } from '@/shared/utils/result'

export function useRecurrentTasksQuery(userId = MOCK_USER_ID) {
  return useQuery({
    queryKey: ['recurrent-tasks', userId],
    queryFn: async () => unwrapResult(await recurrentTasksRepository.listForUser({ userId })),
  })
}
