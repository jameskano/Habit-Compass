import { useQuery } from '@tanstack/react-query'

import { habitsRepository } from '@/integrations/repositories'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import {
  getPageBlockingQueryMeta,
  type PageBlockingQueryOptions,
} from '@/shared/query/pageBlockingQuery'
import type { EntityId, ISODateString } from '@/shared/types'
import { unwrapResult } from '@/shared/utils/result'

export const useHabitLogsRangeQuery = (
  input: { habitId?: EntityId; from: ISODateString; to: ISODateString },
  userId = MOCK_USER_ID,
  options: PageBlockingQueryOptions = {},
) => {
  return useQuery({
    queryKey: ['habit-logs', userId, input.habitId ?? null, input.from, input.to],
    queryFn: async () =>
      unwrapResult(
        await habitsRepository.listLogsForRange({
          userId,
          habitId: input.habitId,
          from: input.from,
          to: input.to,
        }),
      ),
    meta: getPageBlockingQueryMeta(options),
  })
}
