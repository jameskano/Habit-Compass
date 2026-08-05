export type RevenueCatWebhookIdentityEvent = {
  aliases?: string[] | null
  app_user_id?: string | null
  original_app_user_id?: string | null
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const normalizeIdentity = (value: string | null | undefined) => value?.trim() ?? null

export const isSupabaseUserId = (value: string | null | undefined) => {
  const normalizedValue = normalizeIdentity(value)
  return Boolean(normalizedValue && uuidPattern.test(normalizedValue))
}

export const resolveRevenueCatSupabaseUserId = (event: RevenueCatWebhookIdentityEvent) => {
  const candidates = [event.app_user_id, event.original_app_user_id, ...(event.aliases ?? [])].map(
    normalizeIdentity,
  )

  return candidates.find(isSupabaseUserId) ?? null
}
