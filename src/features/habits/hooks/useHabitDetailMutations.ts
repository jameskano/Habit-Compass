import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { CreateHabitInput, UpdateHabitInput } from '@/domain/habits'
import { habitsRepository } from '@/integrations/repositories'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import { useAppToast } from '@/shared/hooks/useAppToast'
import type { EntityId, ISODateString } from '@/shared/types'
import { unwrapResult } from '@/shared/utils/result'

export const useUpdateHabitMutation = () => {
  const queryClient = useQueryClient()
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (input: UpdateHabitInput) =>
      unwrapResult(await habitsRepository.update(input)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['habits'] })
    },
    onError: mutationError,
  })
}

export const useCreateHabitMutation = () => {
  const queryClient = useQueryClient()
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (input: CreateHabitInput) =>
      unwrapResult(await habitsRepository.create(input)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['habits'] })
    },
    onError: mutationError,
  })
}

export const useRestoreHabitMutation = (userId = MOCK_USER_ID) => {
  const queryClient = useQueryClient()
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async ({ habitId, date }: { habitId: EntityId; date: ISODateString }) =>
      unwrapResult(await habitsRepository.restore({ userId, habitId, date })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['habits'] })
    },
    onError: mutationError,
  })
}

export const useResetHabitProgressMutation = (userId = MOCK_USER_ID) => {
  const queryClient = useQueryClient()
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (habitId: EntityId) =>
      unwrapResult(await habitsRepository.hardResetLogs({ userId, habitId, confirmed: true })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['habit-logs', userId] })
    },
    onError: mutationError,
  })
}

export const useDeleteHabitMutation = (userId = MOCK_USER_ID) => {
  const queryClient = useQueryClient()
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (habitId: EntityId) =>
      unwrapResult(await habitsRepository.delete({ userId, habitId })),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['habits'] }),
        queryClient.invalidateQueries({ queryKey: ['habit-logs', userId] }),
      ])
    },
    onError: mutationError,
  })
}

export const useReorderHabitsMutation = (userId = MOCK_USER_ID) => {
  const queryClient = useQueryClient()
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (orderedHabitIds: EntityId[]) =>
      unwrapResult(await habitsRepository.reorder({ userId, orderedHabitIds })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['habits', userId] })
    },
    onError: mutationError,
  })
}
