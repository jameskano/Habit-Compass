import { useCallback, useState } from 'react'

import type { ExportFormat } from '@/domain/export'

import { downloadExportFile } from './downloadExportFile'
import { useExportDataMutation } from './useExportDataMutation'

export type DataExportStatus = 'idle' | 'offline' | 'success' | 'error'

export const useDataExportAction = () => {
  const exportMutation = useExportDataMutation()
  const [status, setStatus] = useState<DataExportStatus>('idle')

  const exportData = useCallback(
    (format: ExportFormat) => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setStatus('offline')
        return
      }

      setStatus('idle')
      exportMutation.mutate(format, {
        onError: () => {
          setStatus('error')
        },
        onSuccess: (file) => {
          downloadExportFile(file)
          setStatus('success')
        },
      })
    },
    [exportMutation],
  )

  return {
    exportData,
    isPending: exportMutation.isPending,
    status,
  }
}
