import { describe, expect, it } from 'vitest'

import { getLegalDocumentMetadataValue } from './legalDocumentMetadata'

describe('legal document metadata', () => {
  it('reads the first matching metadata label', () => {
    const body = ['# Habit Compass Privacy Policy', 'Version: [PRIVACY POLICY VERSION]', ''].join(
      '\n',
    )

    expect(getLegalDocumentMetadataValue(body, ['Version'])).toBe('[PRIVACY POLICY VERSION]')
  })

  it('supports localized label fallbacks', () => {
    const body = [
      '# Politica de Privacidad',
      'Fecha de entrada en vigor: [EFFECTIVE DATE]',
      '',
    ].join('\n')

    expect(
      getLegalDocumentMetadataValue(body, ['Effective date', 'Fecha de entrada en vigor']),
    ).toBe('[EFFECTIVE DATE]')
  })

  it('returns null when no metadata label matches', () => {
    expect(getLegalDocumentMetadataValue('No metadata here', ['Version'])).toBeNull()
  })
})
