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
  async getProfileSettings() {
    const state = getSignedInMockState()

    if (!state.ok) {
      return state
    }

    return ok({
      locale: state.data.appSettings.locale,
      theme: state.data.appSettings.theme,
      weekStartsOn: state.data.appSettings.weekStartsOn,
      onboardingCompletedAt: state.data.appSettings.onboardingCompletedAt,
    })
  },

  async getOnboardingStatus() {
    const state = getSignedInMockState()

    if (!state.ok) {
      return state
    }

    return ok({
      onboardingCompletedAt: state.data.appSettings.onboardingCompletedAt,
    })
  },

  async updateProfilePreferences(preferences) {
    const state = getSignedInMockState()

    if (!state.ok) {
      return state
    }

    state.data.appSettings = {
      ...state.data.appSettings,
      ...preferences,
    }

    return ok({
      locale: state.data.appSettings.locale,
      theme: state.data.appSettings.theme,
      weekStartsOn: state.data.appSettings.weekStartsOn,
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
