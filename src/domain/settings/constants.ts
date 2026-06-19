export const themePreferences = ['light', 'dark', 'system'] as const
export const supportedLocales = ['en', 'es'] as const
export const locales = ['system', ...supportedLocales] as const
export const featureToggleKeys = [
  'mood',
  'weeklyPlanning',
  'suggestions',
  'habitCompletionLevels',
  'categories',
  'reflections',
] as const
