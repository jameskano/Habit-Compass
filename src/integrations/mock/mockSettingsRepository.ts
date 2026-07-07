import type { SettingsRepository } from '@/domain/settings'
import { createAppError } from '@/shared/utils/appError'
import { err, ok } from '@/shared/utils/result'

import { getMockState } from './mockData'

const getSignedInMockState = () => {
  const state = getMockState()

  if (!state.authSession.signedIn) {
    return err(createAppError('unauthorized', 'No signed-in user is available.'))
  }

  return ok(state)
}

export const mockSettingsRepository: SettingsRepository = {
  async getOnboardingStatus() {
    const state = getSignedInMockState()

    if (!state.ok) {
      return state
    }

    return ok({
      onboardingCompletedAt: state.data.appSettings.onboardingCompletedAt,
    })
  },

  async completeOnboarding(completedAt) {
    const state = getSignedInMockState()

    if (!state.ok) {
      return state
    }

    state.data.appSettings.onboardingCompletedAt = completedAt

    return ok({
      onboardingCompletedAt: completedAt,
    })
  },
}
