import type { SettingsRepository } from '@/domain/settings'
import { createAppError } from '@/shared/utils/appError'
import { err, ok } from '@/shared/utils/result'

import { getSupabaseClient } from '../client'
import { getSignedInUserId } from './supabaseRepository.utils'

type ProfileOnboardingRow = {
  onboarding_completed_at: string | null
}

export const supabaseSettingsRepository: SettingsRepository = {
  async getOnboardingStatus() {
    const userId = await getSignedInUserId()

    if (!userId.ok) {
      return userId
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_completed_at')
      .eq('id', userId.data)
      .maybeSingle<ProfileOnboardingRow>()

    if (error) {
      return err(
        createAppError('unknown', 'Could not load onboarding status.', {
          cause: error,
        }),
      )
    }

    if (!data) {
      return err(createAppError('unknown', 'Onboarding status returned no profile data.'))
    }

    return ok({
      onboardingCompletedAt: data.onboarding_completed_at,
    })
  },

  async completeOnboarding(completedAt) {
    const userId = await getSignedInUserId()

    if (!userId.ok) {
      return userId
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .update({ onboarding_completed_at: completedAt })
      .eq('id', userId.data)
      .select('onboarding_completed_at')
      .maybeSingle<ProfileOnboardingRow>()

    if (error) {
      return err(
        createAppError('unknown', 'Could not complete onboarding.', {
          cause: error,
        }),
      )
    }

    if (!data?.onboarding_completed_at) {
      return err(createAppError('unknown', 'Onboarding completion returned no profile data.'))
    }

    return ok({
      onboardingCompletedAt: data.onboarding_completed_at,
    })
  },
}
