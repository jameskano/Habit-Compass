import { useQuery } from '@tanstack/react-query'

import { unwrapResult } from '@/shared/utils/result'
import { moodRepository } from '@/integrations/repositories'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import {
  getPageBlockingQueryMeta,
  type PageBlockingQueryOptions,
} from '@/shared/query/pageBlockingQuery'

type MoodLogsQueryOptions = PageBlockingQueryOptions & {
  enabled?: boolean
}

export const useMoodLogsQuery = (userId = MOCK_USER_ID, options: MoodLogsQueryOptions = {}) => {
  return useQuery({
    queryKey: ['mood-logs', userId],
    queryFn: async () => unwrapResult(await moodRepository.listForUser({ userId })),
    enabled: options.enabled,
    meta: getPageBlockingQueryMeta(options),
  })
}
