import { useMutation, useQueryClient } from '@tanstack/react-query'

import { habitsRepository } from '@/integrations/repositories'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import { useAppToast } from '@/shared/hooks/useAppToast'
import type { EntityId, ISODateString } from '@/shared/types'
import { unwrapResult } from '@/shared/utils/result'

export const useArchiveHabitMutation = (userId = MOCK_USER_ID) => {
  const queryClient = useQueryClient()
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async ({ habitId, date }: { habitId: EntityId; date: ISODateString }) =>
      unwrapResult(await habitsRepository.archive({ userId, habitId, date })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['habits'] })
    },
    onError: mutationError,
  })
}
