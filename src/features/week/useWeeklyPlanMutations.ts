import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { WeeklyPlan, WeeklyReviewFeeling } from '@/domain/planning'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import { planningRepository } from '@/integrations/repositories'
import { useAppToast } from '@/shared/hooks/useAppToast'
import type { EntityId, ISODateString } from '@/shared/types'
import { unwrapResult } from '@/shared/utils/result'

import { weeklyBigRocksQueryKey, weeklyPlanQueryKey } from './useWeeklyPlanQuery'

type ReviewInput = {
  reviewOverallFeeling: WeeklyReviewFeeling | null
  reviewWentWell: string
  reviewGotInWay: string
  reviewAdjustNextWeek: string
  reviewReflections: string
}

const normalizeOptionalText = (value: string) => {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const useWeeklyPlanMutations = (userId = MOCK_USER_ID) => {
  const queryClient = useQueryClient()
  const { mutationError } = useAppToast()

  const ensureWeeklyPlan = async (weekStartDate: ISODateString) => {
    const existingPlan = unwrapResult(await planningRepository.getForWeek({ userId, weekStartDate }))
    if (existingPlan) {
      return existingPlan
    }

    return unwrapResult(
      await planningRepository.create({
        userId,
        weekStartDate,
        focusText: null,
        reviewOverallFeeling: null,
        reviewWentWell: null,
        reviewGotInWay: null,
        reviewAdjustNextWeek: null,
        reviewReflections: null,
      }),
    )
  }

  const invalidatePlan = async (weekStartDate: ISODateString, plan?: WeeklyPlan | null) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: weeklyPlanQueryKey(userId, weekStartDate) }),
      queryClient.invalidateQueries({
        queryKey: weeklyBigRocksQueryKey(userId, plan?.id ?? null),
      }),
      queryClient.invalidateQueries({ queryKey: ['weekly-big-rocks', userId] }),
    ])
  }

  const saveFocus = useMutation({
    mutationFn: async (input: { weekStartDate: ISODateString; focusText: string }) => {
      const plan = await ensureWeeklyPlan(input.weekStartDate)
      return unwrapResult(
        await planningRepository.update({
          id: plan.id,
          focusText: normalizeOptionalText(input.focusText),
        }),
      )
    },
    onSuccess: (plan) => invalidatePlan(plan.weekStartDate, plan),
    onError: mutationError,
  })

  const saveReview = useMutation({
    mutationFn: async (input: { weekStartDate: ISODateString } & ReviewInput) => {
      const plan = await ensureWeeklyPlan(input.weekStartDate)
      return unwrapResult(
        await planningRepository.update({
          id: plan.id,
          reviewOverallFeeling: input.reviewOverallFeeling,
          reviewWentWell: normalizeOptionalText(input.reviewWentWell),
          reviewGotInWay: normalizeOptionalText(input.reviewGotInWay),
          reviewAdjustNextWeek: normalizeOptionalText(input.reviewAdjustNextWeek),
          reviewReflections: normalizeOptionalText(input.reviewReflections),
        }),
      )
    },
    onSuccess: (plan) => invalidatePlan(plan.weekStartDate, plan),
    onError: mutationError,
  })

  const addBigRock = useMutation({
    mutationFn: async (input: { weekStartDate: ISODateString; habitId: EntityId }) => {
      const plan = await ensureWeeklyPlan(input.weekStartDate)
      const bigRock = unwrapResult(
        await planningRepository.addBigRock({
          userId,
          weeklyPlanId: plan.id,
          habitId: input.habitId,
        }),
      )
      return { plan, bigRock }
    },
    onSuccess: ({ plan }) => invalidatePlan(plan.weekStartDate, plan),
    onError: mutationError,
  })

  const removeBigRock = useMutation({
    mutationFn: async (input: {
      weekStartDate: ISODateString
      weeklyPlanId: EntityId
      habitId: EntityId
    }) => {
      unwrapResult(
        await planningRepository.removeBigRock({
          userId,
          weeklyPlanId: input.weeklyPlanId,
          habitId: input.habitId,
        }),
      )
      return input
    },
    onSuccess: (input) =>
      invalidatePlan(input.weekStartDate, {
        id: input.weeklyPlanId,
        userId,
        weekStartDate: input.weekStartDate,
        createdAt: '',
        updatedAt: '',
      }),
    onError: mutationError,
  })

  return {
    saveFocus,
    saveReview,
    addBigRock,
    removeBigRock,
  }
}
