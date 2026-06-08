import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { UpsertHabitLogInput } from '@/domain/habits'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import { habitsRepository } from '@/integrations/repositories'
import { useAppToast } from '@/shared/hooks/useAppToast'
import type { EntityId, ISODateString } from '@/shared/types'
import { unwrapResult } from '@/shared/utils/result'

function useInvalidateHabitLogs(userId: string) {
  const queryClient = useQueryClient()

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['habit-logs', userId] }),
      queryClient.invalidateQueries({ queryKey: ['habits', 'today', userId] }),
    ])
  }
}

export function useUpsertHabitLogMutation(userId = MOCK_USER_ID) {
  const invalidateHabitLogs = useInvalidateHabitLogs(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (input: Omit<UpsertHabitLogInput, 'userId'>) =>
      unwrapResult(await habitsRepository.upsertLog({ ...input, userId })),
    onSuccess: invalidateHabitLogs,
    onError: mutationError,
  })
}

export function useRemoveHabitLogMutation(userId = MOCK_USER_ID) {
  const invalidateHabitLogs = useInvalidateHabitLogs(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async ({ habitId, logDate }: { habitId: EntityId; logDate: ISODateString }) =>
      unwrapResult(await habitsRepository.removeLog({ userId, habitId, logDate })),
    onSuccess: invalidateHabitLogs,
    onError: mutationError,
  })
}
