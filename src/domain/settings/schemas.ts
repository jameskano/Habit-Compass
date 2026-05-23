import { z } from 'zod'

import { BaseEntityFieldsSchema, IsoDateTimeStringSchema } from '@/shared/types'

import { featureToggleKeys, locales, themePreferences } from './constants'

export const ThemePreferenceSchema = z.enum(themePreferences)
export const AppLocaleSchema = z.enum(locales)
export const FeatureToggleKeySchema = z.enum(featureToggleKeys)

export const FeatureTogglesSchema = z.object({
  mood: z.boolean(),
  weeklyPlanning: z.boolean(),
  suggestions: z.boolean(),
  minimumStandardDeep: z.boolean(),
  categories: z.boolean(),
  reflections: z.boolean(),
})

export const AppSettingsSchema = BaseEntityFieldsSchema.extend({
  theme: ThemePreferenceSchema,
  locale: AppLocaleSchema,
  weekStartsOn: z.union([z.literal(0), z.literal(1)]),
  featureToggles: FeatureTogglesSchema,
  onboardingCompletedAt: IsoDateTimeStringSchema.optional().nullable(),
})
