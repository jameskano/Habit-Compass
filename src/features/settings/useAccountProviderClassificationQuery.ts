import { useQuery } from '@tanstack/react-query'

import { authRepository } from '@/integrations/repositories'
import { unwrapResult } from '@/shared/utils/result'

export const accountProviderClassificationQueryKey = ['account-provider-classification'] as const

export const useAccountProviderClassificationQuery = () =>
  useQuery({
    queryKey: accountProviderClassificationQueryKey,
    queryFn: async () => unwrapResult(await authRepository.getProviderClassification()),
  })
