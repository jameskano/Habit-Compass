import { describe, expect, it } from 'vitest'

import { getMessages } from './messages'

describe('getMessages', () => {
  it('falls back to English for unsupported locales', () => {
    expect(getMessages('unsupported')['app.name']).toBe('Habit Compass')
  })
})
