import { useQuery } from '@tanstack/react-query'

import { habitsRepository } from '@/integrations/repositories'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import type { ISODateString } from '@/shared/types'
import { unwrapResult } from '@/shared/utils/result'

export function useHabitLogsRangeQuery(
  input: { from: ISODateString; to: ISODateString },
  userId = MOCK_USER_ID,
) {
  return useQuery({
    queryKey: ['habit-logs', userId, input.from, input.to],
    queryFn: async () =>
      unwrapResult(
        await habitsRepository.listLogsForRange({
          userId,
          from: input.from,
          to: input.to,
        }),
      ),
  })
}
