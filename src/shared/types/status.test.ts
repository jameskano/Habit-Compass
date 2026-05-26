import { describe, expect, it } from 'vitest'

import { LifecycleStatusSchema } from './status'

describe('LifecycleStatusSchema', () => {
  it('allows only active and archived item lifecycle states', () => {
    expect(LifecycleStatusSchema.safeParse('active').success).toBe(true)
    expect(LifecycleStatusSchema.safeParse('archived').success).toBe(true)
    expect(LifecycleStatusSchema.safeParse('deleted').success).toBe(false)
  })
})
