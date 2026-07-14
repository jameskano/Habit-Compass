import { useQuery } from '@tanstack/react-query'

import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import { planningRepository } from '@/integrations/repositories'
import {
  getPageBlockingQueryMeta,
  type PageBlockingQueryOptions,
} from '@/shared/query/pageBlockingQuery'
import type { ISODateString } from '@/shared/types'
import { unwrapResult } from '@/shared/utils/result'

export const weeklyPlanQueryKey = (userId: string, weekStartDate: ISODateString) => [
  'weekly-plan',
  userId,
  weekStartDate,
]

export const weeklyBigRocksQueryKey = (userId: string, weeklyPlanId: string | null) => [
  'weekly-big-rocks',
  userId,
  weeklyPlanId,
]

export const useWeeklyPlanQuery = (
  weekStartDate: ISODateString,
  userId = MOCK_USER_ID,
  options: PageBlockingQueryOptions = {},
) => {
  return useQuery({
    queryKey: weeklyPlanQueryKey(userId, weekStartDate),
    queryFn: async () =>
      unwrapResult(await planningRepository.getForWeek({ userId, weekStartDate })),
    meta: getPageBlockingQueryMeta(options),
  })
}

export const useWeeklyBigRocksQuery = (
  weeklyPlanId: string | null,
  userId = MOCK_USER_ID,
  options: PageBlockingQueryOptions = {},
) => {
  return useQuery({
    queryKey: weeklyBigRocksQueryKey(userId, weeklyPlanId),
    queryFn: async () => {
      if (!weeklyPlanId) {
        return []
      }

      return unwrapResult(await planningRepository.listBigRocks({ userId, weeklyPlanId }))
    },
    meta: getPageBlockingQueryMeta(options),
  })
}
