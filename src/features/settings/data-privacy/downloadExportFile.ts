import type { ExportFile } from '@/domain/export'

export const downloadExportFile = (file: ExportFile) => {
  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return false
  }

  const url = URL.createObjectURL(file.blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = file.filename
  anchor.rel = 'noopener'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)

  return true
}
