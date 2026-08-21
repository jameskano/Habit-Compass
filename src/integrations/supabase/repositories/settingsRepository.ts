import {
  AppProfilePreferencesSchema,
  ProfileSettingsSchema,
  type AppProfilePreferences,
  type ProfileSettings,
  type SettingsRepository,
} from '@/domain/settings'
import { createAppError } from '@/shared/utils/appError'
import { err, ok, type Result } from '@/shared/utils/result'

import { getSupabaseClient } from '../client'
import { getSignedInUserId } from './supabaseRepository.utils'

type ProfileOnboardingRow = {
  onboarding_completed_at: string | null
}

type ProfileSettingsRow = ProfileOnboardingRow & {
  language: string
  theme_preference: string
  first_day_of_week: number
}

const profileSettingsSelect =
  'language, theme_preference, first_day_of_week, onboarding_completed_at'

const mapProfileSettingsRow = (row: ProfileSettingsRow): Result<ProfileSettings> => {
  const parsed = ProfileSettingsSchema.safeParse({
    locale: row.language,
    theme: row.theme_preference,
    weekStartsOn: row.first_day_of_week,
    onboardingCompletedAt: row.onboarding_completed_at,
  })

  if (!parsed.success) {
    return err(
      createAppError('unknown', 'Profile settings returned invalid data.', {
        cause: parsed.error,
      }),
    )
  }

  return ok(parsed.data)
}

const mapProfilePreferencesRow = (row: ProfileSettingsRow): Result<AppProfilePreferences> => {
  const mappedSettings = mapProfileSettingsRow(row)

  if (!mappedSettings.ok) {
    return mappedSettings
  }

  const parsed = AppProfilePreferencesSchema.safeParse({
    locale: mappedSettings.data.locale,
    theme: mappedSettings.data.theme,
    weekStartsOn: mappedSettings.data.weekStartsOn,
  })

  if (!parsed.success) {
    return err(
      createAppError('unknown', 'Profile preferences returned invalid data.', {
        cause: parsed.error,
      }),
    )
  }

  return ok(parsed.data)
}

export const supabaseSettingsRepository: SettingsRepository = {
  async getProfileSettings() {
    const userId = await getSignedInUserId()

    if (!userId.ok) {
      return userId
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select(profileSettingsSelect)
      .eq('id', userId.data)
      .maybeSingle<ProfileSettingsRow>()

    if (error) {
      return err(
        createAppError('unknown', 'Could not load profile settings.', {
          cause: error,
        }),
      )
    }

    if (!data) {
      return err(createAppError('unknown', 'Profile settings returned no profile data.'))
    }

    return mapProfileSettingsRow(data)
  },

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

  async updateProfilePreferences(preferences) {
    const userId = await getSignedInUserId()

    if (!userId.ok) {
      return userId
    }

    const parsedPreferences = AppProfilePreferencesSchema.partial().safeParse(preferences)

    if (!parsedPreferences.success) {
      return err(
        createAppError('validation', 'Profile preferences are invalid.', {
          cause: parsedPreferences.error,
        }),
      )
    }

    const updates: {
      first_day_of_week?: AppProfilePreferences['weekStartsOn']
      language?: AppProfilePreferences['locale']
      theme_preference?: AppProfilePreferences['theme']
    } = {}

    if (parsedPreferences.data.locale !== undefined) {
      updates.language = parsedPreferences.data.locale
    }

    if (parsedPreferences.data.theme !== undefined) {
      updates.theme_preference = parsedPreferences.data.theme
    }

    if (parsedPreferences.data.weekStartsOn !== undefined) {
      updates.first_day_of_week = parsedPreferences.data.weekStartsOn
    }

    const supabase = getSupabaseClient()
    const query =
      Object.keys(updates).length === 0
        ? supabase.from('profiles').select(profileSettingsSelect)
        : supabase.from('profiles').update(updates).select(profileSettingsSelect)

    const { data, error } = await query.eq('id', userId.data).maybeSingle<ProfileSettingsRow>()

    if (error) {
      return err(
        createAppError('unknown', 'Could not update profile preferences.', {
          cause: error,
        }),
      )
    }

    if (!data) {
      return err(createAppError('unknown', 'Profile preference update returned no profile data.'))
    }

    return mapProfilePreferencesRow(data)
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
