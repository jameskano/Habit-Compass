import { beforeEach, describe, expect, it } from 'vitest'

import { resetMockState } from './mockData'
import { mockSettingsRepository } from './mockSettingsRepository'

describe('mockSettingsRepository', () => {
  beforeEach(() => {
    resetMockState()
  })

  it('loads profile preferences with onboarding status', async () => {
    const result = await mockSettingsRepository.getProfileSettings()

    expect(result).toEqual({
      ok: true,
      data: expect.objectContaining({
        locale: 'system',
        theme: 'system',
        weekStartsOn: 1,
        onboardingCompletedAt: expect.any(String),
      }),
    })
  })

  it('updates and returns normalized profile preferences', async () => {
    const result = await mockSettingsRepository.updateProfilePreferences({
      locale: 'es',
      theme: 'dark',
      weekStartsOn: 0,
    })

    expect(result).toEqual({
      ok: true,
      data: {
        locale: 'es',
        theme: 'dark',
        weekStartsOn: 0,
      },
    })

    await expect(mockSettingsRepository.getProfileSettings()).resolves.toEqual({
      ok: true,
      data: expect.objectContaining({
        locale: 'es',
        theme: 'dark',
        weekStartsOn: 0,
      }),
    })
  })
})
