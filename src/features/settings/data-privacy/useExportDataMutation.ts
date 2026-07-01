import { useMutation } from '@tanstack/react-query'

import type { ExportFormat } from '@/domain/export'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import { dataExportRepository } from '@/integrations/repositories'
import { unwrapResult } from '@/shared/utils/result'

export const useExportDataMutation = () =>
  useMutation({
    mutationFn: async (format: ExportFormat) =>
      unwrapResult(
        await dataExportRepository.exportData({
          userId: MOCK_USER_ID,
          format,
        }),
      ),
  })
