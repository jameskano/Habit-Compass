import { useQuery } from '@tanstack/react-query'

import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import { recurrentTasksRepository } from '@/integrations/repositories'
import type { EntityId, ISODateString } from '@/shared/types'
import { unwrapResult } from '@/shared/utils/result'

export function useRecurrentTaskOccurrencesQuery(
  input: { recurrentTaskId?: EntityId; from: ISODateString; to: ISODateString },
  userId = MOCK_USER_ID,
) {
  return useQuery({
    queryKey: ['recurrent-task-occurrences', userId, input.recurrentTaskId ?? 'all', input.from, input.to],
    queryFn: async () =>
      unwrapResult(
        await recurrentTasksRepository.listOccurrencesForRange({
          userId,
          ...input,
        }),
      ),
  })
}
