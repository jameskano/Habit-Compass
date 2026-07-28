import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ExportFile } from '@/domain/export'

import { downloadExportFile } from './downloadExportFile'

const pluginMocks = vi.hoisted(() => ({
  isNativePlatform: vi.fn(() => false),
  getPlatform: vi.fn(() => 'web'),
  registerPlugin: vi.fn(),
  saveToDownloads: vi.fn(),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: pluginMocks.isNativePlatform,
    getPlatform: pluginMocks.getPlatform,
  },
  registerPlugin: pluginMocks.registerPlugin,
}))

const createExportFile = (): ExportFile => ({
  blob: new Blob(['{"ok":true}'], { type: 'application/json' }),
  filename: 'habit-compass-export-2026-07-28.json',
  mimeType: 'application/json',
})

describe('downloadExportFile', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    pluginMocks.isNativePlatform.mockReturnValue(false)
    pluginMocks.getPlatform.mockReturnValue('web')
    pluginMocks.registerPlugin.mockReturnValue({
      saveToDownloads: pluginMocks.saveToDownloads,
    })
    pluginMocks.saveToDownloads.mockResolvedValue({ uri: 'content://downloads/export.json' })
  })

  it('uses the browser download fallback outside Android native runtime', async () => {
    const createObjectURL = vi.fn(() => 'blob:export')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const didDownload = await downloadExportFile(createExportFile())

    expect(didDownload).toBe(true)
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(click).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:export')
    expect(pluginMocks.registerPlugin).not.toHaveBeenCalled()
    expect(pluginMocks.saveToDownloads).not.toHaveBeenCalled()
  })

  it('saves the export directly to Android Downloads', async () => {
    pluginMocks.isNativePlatform.mockReturnValue(true)
    pluginMocks.getPlatform.mockReturnValue('android')
    const createObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() })

    const didDownload = await downloadExportFile(createExportFile())

    expect(didDownload).toBe(true)
    expect(pluginMocks.registerPlugin).toHaveBeenCalledWith('ExportDownloads')
    expect(pluginMocks.saveToDownloads).toHaveBeenCalledWith({
      data: 'eyJvayI6dHJ1ZX0=',
      filename: 'habit-compass-export-2026-07-28.json',
      mimeType: 'application/json',
    })
    expect(createObjectURL).not.toHaveBeenCalled()
  })
})
