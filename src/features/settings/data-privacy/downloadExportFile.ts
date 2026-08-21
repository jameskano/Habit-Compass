import type { ExportFile } from '@/domain/export'

type ExportDownloadsPlugin = {
  saveToDownloads(input: {
    data: string
    filename: string
    mimeType: string
  }): Promise<{ uri: string }>
}

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(reader.error ?? new Error('Export file could not be read.'))
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Export file could not be encoded.'))
        return
      }

      const [, base64] = reader.result.split(',', 2)
      resolve(base64 ?? '')
    }

    reader.readAsDataURL(blob)
  })

const saveExportFileToAndroidDownloads = async (file: ExportFile) => {
  const { Capacitor, registerPlugin } = await import('@capacitor/core')

  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return false
  }

  const data = await blobToBase64(file.blob)
  const exportDownloads = registerPlugin<ExportDownloadsPlugin>('ExportDownloads')

  await exportDownloads.saveToDownloads({
    data,
    filename: file.filename,
    mimeType: file.mimeType,
  })

  return true
}

const downloadExportFileInBrowser = (file: ExportFile) => {
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

export const downloadExportFile = async (file: ExportFile) => {
  if (await saveExportFileToAndroidDownloads(file)) {
    return true
  }

  return downloadExportFileInBrowser(file)
}
