import { useQuery } from '@tanstack/react-query'

import { unwrapResult } from '@/shared/utils/result'
import { moodRepository } from '@/integrations/repositories'
import { mockData, MOCK_USER_ID } from '@/integrations/mock/mockData'

export const useMoodLogForDateQuery = (userId = MOCK_USER_ID, date = mockData.today) => {
  return useQuery({
    queryKey: ['mood-logs', 'by-date', userId, date],
    queryFn: async () => unwrapResult(await moodRepository.getForDate({ userId, date })),
  })
}
