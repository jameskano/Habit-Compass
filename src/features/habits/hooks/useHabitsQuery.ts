import { useQuery } from '@tanstack/react-query'

import { unwrapResult } from '@/shared/lib/result'
import { habitsRepository } from '@/integrations/repositories'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'

export function useHabitsQuery(userId = MOCK_USER_ID) {
  return useQuery({
    queryKey: ['habits', userId],
    queryFn: async () => unwrapResult(await habitsRepository.listForUser({ userId })),
  })
}
