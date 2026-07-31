import { z } from 'zod'

import { BaseEntityFieldsSchema, IsoDateTimeStringSchema } from '@/shared/types'

import { featureToggleKeys, locales, themePreferences } from './constants'

export const ThemePreferenceSchema = z.enum(themePreferences)
export const AppLocaleSchema = z.enum(locales)
export const WeekStartsOnSchema = z.union([z.literal(0), z.literal(1)])
export const FeatureToggleKeySchema = z.enum(featureToggleKeys)

export const FeatureTogglesSchema = z.object({
  mood: z.boolean(),
  weeklyPlanning: z.boolean(),
  suggestions: z.boolean(),
  habitCompletionLevels: z.boolean(),
  categories: z.boolean(),
  reflections: z.boolean(),
})

export const AppProfilePreferencesSchema = z.object({
  theme: ThemePreferenceSchema,
  locale: AppLocaleSchema,
  weekStartsOn: WeekStartsOnSchema,
})

export const ProfileSettingsSchema = AppProfilePreferencesSchema.extend({
  onboardingCompletedAt: IsoDateTimeStringSchema.nullable(),
})

export const AppSettingsSchema = BaseEntityFieldsSchema.extend({
  ...AppProfilePreferencesSchema.shape,
  featureToggles: FeatureTogglesSchema,
  onboardingCompletedAt: IsoDateTimeStringSchema.optional().nullable(),
})
