import { useQuery } from '@tanstack/react-query'

import { authRepository } from '@/integrations/repositories'
import { unwrapResult } from '@/shared/utils/result'

export const securityProfileQueryKey = ['auth-security-profile'] as const

export const useSecurityProfileQuery = () =>
  useQuery({
    queryKey: securityProfileQueryKey,
    queryFn: async () => unwrapResult(await authRepository.getSecurityProfile()),
  })
