import { useQuery } from '@tanstack/react-query'

import { unwrapResult } from '@/shared/utils/result'
import { moodRepository } from '@/integrations/repositories'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'

export function useMoodLogsQuery(userId = MOCK_USER_ID) {
  return useQuery({
    queryKey: ['mood-logs', userId],
    queryFn: async () => unwrapResult(await moodRepository.listForUser({ userId })),
  })
}
