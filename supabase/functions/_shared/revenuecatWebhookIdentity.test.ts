import { describe, expect, it } from 'vitest'

import { isSupabaseUserId, resolveRevenueCatSupabaseUserId } from './revenuecatWebhookIdentity'

const supabaseUserId = '9b571ed0-f4cc-46a5-967f-c71f997eb03a'

describe('RevenueCat webhook identity', () => {
  it('accepts trimmed Supabase UUID app user IDs', () => {
    expect(isSupabaseUserId(` ${supabaseUserId}\n`)).toBe(true)
    expect(resolveRevenueCatSupabaseUserId({ app_user_id: ` ${supabaseUserId}\n` })).toBe(
      supabaseUserId,
    )
  })

  it('falls back to original app user ID and aliases', () => {
    expect(
      resolveRevenueCatSupabaseUserId({
        aliases: ['anonymous-id', supabaseUserId],
        app_user_id: '$RCAnonymousID:abc',
      }),
    ).toBe(supabaseUserId)

    expect(
      resolveRevenueCatSupabaseUserId({
        app_user_id: '$RCAnonymousID:abc',
        original_app_user_id: supabaseUserId,
      }),
    ).toBe(supabaseUserId)
  })

  it('returns null for unresolvable RevenueCat anonymous IDs', () => {
    expect(
      resolveRevenueCatSupabaseUserId({
        aliases: ['$RCAnonymousID:def'],
        app_user_id: '$RCAnonymousID:abc',
      }),
    ).toBeNull()
  })
})
