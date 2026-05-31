import { useMutation, useQueryClient } from '@tanstack/react-query'

import { habitsRepository } from '@/integrations/repositories'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import type { EntityId, ISODateString } from '@/shared/types'
import { unwrapResult } from '@/shared/utils/result'

export function useArchiveHabitMutation(userId = MOCK_USER_ID) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ habitId, date }: { habitId: EntityId; date: ISODateString }) =>
      unwrapResult(await habitsRepository.archive({ userId, habitId, date })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['habits'] })
    },
  })
}
