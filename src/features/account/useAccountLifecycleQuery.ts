import { useQuery } from '@tanstack/react-query'

import { accountLifecycleRepository } from '@/integrations/repositories'
import { unwrapResult } from '@/shared/utils/result'

export const accountLifecycleQueryKey = ['accountLifecycle'] as const

export const useAccountLifecycleQuery = () =>
  useQuery({
    queryKey: accountLifecycleQueryKey,
    queryFn: async () => unwrapResult(await accountLifecycleRepository.getAccountLifecycle()),
    retry: false,
  })
