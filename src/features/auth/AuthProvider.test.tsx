import { QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAppQueryClient } from '@/app/providers/queryClient'
import { useAppPreferencesStore } from '@/app/state/appPreferencesStore'
import { ok } from '@/shared/utils/result'

import { AuthProvider } from './AuthProvider'
import { useAuth } from './authContext'

const repositoriesMock = vi.hoisted(() => ({
  authRepository: {
    ensureUserProvisioned: vi.fn(),
    getCurrentLegalStatus: vi.fn(),
    getStoredSession: vi.fn(),
    getVerifiedUser: vi.fn(),
    signOutLocal: vi.fn(),
    subscribeToAuthChanges: vi.fn(),
  },
  settingsRepository: {
    getProfileSettings: vi.fn(),
    getOnboardingStatus: vi.fn(),
  },
  subscriptionRepository: {
    clearIdentity: vi.fn(),
    identifyUser: vi.fn(),
  },
}))

vi.mock('@/integrations/repositories', () => repositoriesMock)

vi.mock('./authCleanup', () => ({
  clearUserOwnedState: vi.fn(),
}))

const AuthStateProbe = () => {
  const { state } = useAuth()

  return <div>{state.status === 'authenticated' ? state.user.id : state.status}</div>
}

const renderAuthProvider = (children: ReactNode) => {
  const queryClient = createAppQueryClient()

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>,
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    repositoriesMock.authRepository.getStoredSession.mockResolvedValue(
      ok({ user: { email: 'user@example.com', id: 'user-1' } }),
    )
    repositoriesMock.authRepository.getVerifiedUser.mockResolvedValue(
      ok({ email: 'user@example.com', id: 'user-1' }),
    )
    repositoriesMock.authRepository.ensureUserProvisioned.mockResolvedValue(
      ok({ googleEnabled: true, passwordEnabled: false, userId: 'user-1' }),
    )
    repositoriesMock.authRepository.getCurrentLegalStatus.mockResolvedValue(
      ok({
        accepted: true,
        acceptedAt: '2026-07-28T00:00:00.000Z',
        currentPrivacyPolicyVersion: '2026-07-28',
        currentTermsVersion: '2026-07-28',
      }),
    )
    repositoriesMock.authRepository.subscribeToAuthChanges.mockReturnValue({
      unsubscribe: vi.fn(),
    })
    repositoriesMock.authRepository.signOutLocal.mockResolvedValue(ok(null))
    repositoriesMock.settingsRepository.getProfileSettings.mockResolvedValue(
      ok({
        locale: 'system',
        theme: 'system',
        weekStartsOn: 1,
        onboardingCompletedAt: '2026-07-28T00:00:00.000Z',
      }),
    )
    repositoriesMock.settingsRepository.getOnboardingStatus.mockResolvedValue(
      ok({ onboardingCompletedAt: '2026-07-28T00:00:00.000Z' }),
    )
    repositoriesMock.subscriptionRepository.clearIdentity.mockResolvedValue(ok(null))
    repositoriesMock.subscriptionRepository.identifyUser.mockResolvedValue(ok(null))
    useAppPreferencesStore.setState({
      locale: 'en',
      theme: 'dark',
      weekStartsOn: 0,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('does not keep auth startup stuck when subscription identity never resolves', async () => {
    vi.useFakeTimers()
    repositoriesMock.subscriptionRepository.identifyUser.mockReturnValue(new Promise(() => {}))

    renderAuthProvider(<AuthStateProbe />)

    expect(screen.getByText('initializing')).toBeInTheDocument()

    await act(async () => {
      await Promise.resolve()
    })

    expect(repositoriesMock.subscriptionRepository.identifyUser).toHaveBeenCalledWith('user-1')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000)
    })

    expect(screen.getByText('user-1')).toBeInTheDocument()
  })

  it('hydrates app preferences from the signed-in profile during startup', async () => {
    repositoriesMock.settingsRepository.getProfileSettings.mockResolvedValue(
      ok({
        locale: 'es',
        theme: 'light',
        weekStartsOn: 1,
        onboardingCompletedAt: '2026-07-28T00:00:00.000Z',
      }),
    )

    renderAuthProvider(<AuthStateProbe />)

    expect(await screen.findByText('user-1')).toBeInTheDocument()
    expect(useAppPreferencesStore.getState()).toEqual(
      expect.objectContaining({
        locale: 'es',
        theme: 'light',
        weekStartsOn: 1,
      }),
    )
  })
})
