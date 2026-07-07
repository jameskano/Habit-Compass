import { useQuery } from '@tanstack/react-query'

import { subscriptionRepository } from '@/integrations/repositories'
import { unwrapResult } from '@/shared/utils/result'

export const subscriptionSnapshotQueryKey = ['subscription-snapshot'] as const

export const useSubscriptionSnapshotQuery = () =>
  useQuery({
    queryKey: subscriptionSnapshotQueryKey,
    queryFn: async () => unwrapResult(await subscriptionRepository.getSnapshot()),
  })
