import type { DataExportRepository, ExportFormat } from '@/domain/export'
import { buildExportFilename } from '@/domain/export'
import { createAppError } from '@/shared/utils/appError'
import { err, ok } from '@/shared/utils/result'

import { getSupabaseClient } from '../client'

const exportMimeTypes: Record<ExportFormat, string> = {
  csv: 'application/zip',
  json: 'application/json',
}

const buildBlob = (data: unknown, format: ExportFormat) => {
  if (data instanceof Blob) {
    return data
  }

  if (data instanceof Uint8Array) {
    const bytes = data.slice()
    return new Blob([bytes.buffer], { type: exportMimeTypes[format] })
  }

  if (typeof data === 'string') {
    return new Blob([data], { type: exportMimeTypes[format] })
  }

  return new Blob([JSON.stringify(data, null, 2)], { type: exportMimeTypes[format] })
}

export const supabaseDataExportRepository: DataExportRepository = {
  async exportData({ format, generatedAt = new Date() }) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.functions.invoke('export-data', {
      body: { format },
    })

    if (error) {
      return err(
        createAppError('unknown', 'Data export could not be generated.', {
          cause: error,
        }),
      )
    }

    return ok({
      blob: buildBlob(data, format),
      filename: buildExportFilename(format, generatedAt),
      mimeType: exportMimeTypes[format],
    })
  },
}
