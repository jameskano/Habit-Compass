import { useQuery } from '@tanstack/react-query'

import { authRepository } from '@/integrations/repositories'
import { unwrapResult } from '@/shared/utils/result'

export const accountCapabilitiesQueryKey = ['account-capabilities'] as const

export const useAccountCapabilitiesQuery = () =>
  useQuery({
    queryKey: accountCapabilitiesQueryKey,
    queryFn: async () => unwrapResult(await authRepository.getAccountCapabilities()),
  })
